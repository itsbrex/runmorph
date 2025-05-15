import fs from "fs";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { glob } from "glob";
import { parse } from "node-html-parser";

// Define supported SVG elements
const SUPPORTED_ELEMENTS = ["path", "rect"] as const;
type SupportedElement = (typeof SUPPORTED_ELEMENTS)[number];

interface GenerateOptions {
  source: string;
  target: string;
}

interface SvgElement {
  d?: string;
  x?: string;
  y?: string;
  width?: string;
  height?: string;
  rx?: string;
  fill: string;
  fillOpacity?: string;
  fillRule?: string;
  isClipPath?: boolean;
  isWrappedInG?: boolean;
  transform?: string;
  type: SupportedElement;
}

interface SvgInfo {
  viewBox: string;
  width: string;
  height: string;
  elements: SvgElement[];
  gElements: SvgElement[];
  hasClipPath: boolean;
  hasMask: boolean;
  hasGWrapper: boolean;
  clipPath?: SvgElement;
  maskId?: string;
}

// Color name to hex mapping
const COLOR_NAMES: { [key: string]: string } = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#00ff00",
  blue: "#0000ff",
  yellow: "#ffff00",
};

function isSupportedElement(tagName: string): tagName is SupportedElement {
  return SUPPORTED_ELEMENTS.includes(tagName.toLowerCase() as SupportedElement);
}

function normalizeColor(color: string | null): string {
  if (!color) return "#000000";
  if (color.startsWith("#")) return color.toLowerCase();
  if (COLOR_NAMES[color.toLowerCase()]) {
    return COLOR_NAMES[color.toLowerCase()];
  }
  return "#000000";
}

function parseSvg(content: string): SvgInfo {
  const root = parse(content);
  const svg = root.querySelector("svg");

  if (!svg) {
    throw new Error("No SVG element found");
  }

  // Check for unsupported elements first
  const allElements = svg.querySelectorAll("*");
  for (const el of allElements) {
    const tagName = el.tagName.toLowerCase();
    if (["svg", "g", "defs", "clippath", "mask"].includes(tagName)) {
      continue;
    }
    if (!isSupportedElement(tagName)) {
      throw new Error(`<${tagName}> element not supported`);
    }
  }

  const elements: SvgElement[] = [];
  const gElements: SvgElement[] = [];
  let clipPath: SvgElement | undefined;
  let maskId: string | undefined;

  const gElement = svg.querySelector("g");
  const hasGWrapper = gElement !== null;
  const clipPathAttr = gElement?.getAttribute("clip-path");
  const maskAttr = gElement?.getAttribute("mask");

  const hasClipPath = hasGWrapper && clipPathAttr !== null;
  const hasMask = hasGWrapper && maskAttr !== null;

  if (hasMask) {
    const match = maskAttr?.match(/url\(#(.*?)\)/);
    if (match) {
      maskId = match[1];
    }
  } else if (hasClipPath) {
    const match = clipPathAttr?.match(/url\(#(.*?)\)/);
    if (match) {
      maskId = match[1];
    }
  }

  svg.querySelectorAll("path, rect").forEach((el: any) => {
    const isPath = el.tagName.toLowerCase() === "path";
    const isClipPath = el.parentNode?.tagName?.toLowerCase() === "clippath";
    const rawFill = el.getAttribute("fill");
    const fill = normalizeColor(
      rawFill || (isPath && !isClipPath ? "black" : "black")
    );
    const isWrappedInG = el.parentNode?.tagName?.toLowerCase() === "g";

    const commonAttrs = {
      fill,
      fillOpacity: el.getAttribute("fill-opacity") || undefined,
      fillRule: el.getAttribute("fill-rule") || undefined,
      transform: el.getAttribute("transform") || undefined,
      isClipPath,
      isWrappedInG,
      type: isPath ? ("path" as const) : ("rect" as const),
    };

    if (isPath) {
      const d = el.getAttribute("d");
      if (d) {
        const pathInfo: SvgElement = {
          ...commonAttrs,
          d,
        };

        if (isClipPath) {
          clipPath = pathInfo;
        } else if (isWrappedInG) {
          gElements.push(pathInfo);
        } else {
          elements.push(pathInfo);
        }
      }
    } else {
      const rectAttrs = {
        x: el.getAttribute("x") || undefined,
        y: el.getAttribute("y") || undefined,
        width: el.getAttribute("width") || undefined,
        height: el.getAttribute("height") || undefined,
        rx: el.getAttribute("rx") || undefined,
      };

      if (rectAttrs.width && rectAttrs.height) {
        const rectInfo: SvgElement = {
          ...commonAttrs,
          ...rectAttrs,
        };

        if (isClipPath) {
          clipPath = rectInfo;
        } else if (isWrappedInG) {
          gElements.push(rectInfo);
        } else {
          elements.push(rectInfo);
        }
      }
    }
  });

  return {
    viewBox: svg.getAttribute("viewBox") || "0 0 62 62",
    width: svg.getAttribute("width") || "62",
    height: svg.getAttribute("height") || "62",
    elements,
    gElements,
    hasClipPath,
    hasMask,
    hasGWrapper,
    clipPath,
    maskId,
  };
}

function generateComponentName(fileName: string) {
  return (
    path
      .basename(fileName, ".svg")
      .split("-")
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("") + "Icon"
  );
}

function generateComponent(fileName: string, svgInfo: SvgInfo): string {
  const colors = [
    ...new Set(
      [...svgInfo.elements, ...svgInfo.gElements]
        .filter((el) => !el.isClipPath)
        .map((el) => el.fill)
    ),
  ].filter(
    (color) =>
      color && (color.startsWith("#") || COLOR_NAMES[color.toLowerCase()])
  );

  const componentName = generateComponentName(fileName);

  function renderElement(el: SvgElement) {
    const commonAttrs = [
      el.fillOpacity ? `fillOpacity="${el.fillOpacity}"` : "",
      el.fillRule ? `fillRule="${el.fillRule}"` : "",
      el.transform ? `transform="${el.transform}"` : "",
    ].filter(Boolean);

    const colorIndex = colors.indexOf(el.fill);

    if (el.type === "path") {
      return `      <path
        d="${el.d}"
        ${commonAttrs.join("\n        ")}
        fill={palette[${colorIndex}]}
      />`;
    } else {
      const rectAttrs = [
        el.x ? `x="${el.x}"` : "",
        el.y ? `y="${el.y}"` : "",
        el.width ? `width="${el.width}"` : "",
        el.height ? `height="${el.height}"` : "",
        el.rx ? `rx="${el.rx}"` : "",
        ...commonAttrs,
      ].filter(Boolean);

      return `      <rect
        ${rectAttrs.join("\n        ")}
        fill={palette[${colorIndex}]}
      />`;
    }
  }

  const elementJsx = svgInfo.elements.map(renderElement).join("\n");
  const gElementJsx = svgInfo.gElements.map(renderElement).join("\n");

  const svgContent = [
    elementJsx,
    svgInfo.hasGWrapper
      ? `    <g${svgInfo.hasMask ? ` mask="url(#${svgInfo.maskId})"` : svgInfo.hasClipPath ? ` clipPath="url(#${fileName}-clip)"` : ""}>
${gElementJsx}
    </g>`
      : "",
    svgInfo.hasClipPath && !svgInfo.hasMask
      ? `    <defs>
      <clipPath id="${fileName}-clip">
        ${
          svgInfo.clipPath
            ? svgInfo.clipPath.type === "path"
              ? `<path d="${svgInfo.clipPath.d}"${svgInfo.clipPath.transform ? ` transform="${svgInfo.clipPath.transform}"` : ""} />`
              : `<rect x="${svgInfo.clipPath.x}" y="${svgInfo.clipPath.y}" width="${svgInfo.clipPath.width}" height="${svgInfo.clipPath.height}"${svgInfo.clipPath.rx ? ` rx="${svgInfo.clipPath.rx}"` : ""}${svgInfo.clipPath.transform ? ` transform="${svgInfo.clipPath.transform}"` : ""} />`
            : ""
        }
      </clipPath>
    </defs>`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `import React from "react";
import { iconify } from "@runmorph/iconify";
import type { Palette } from "@runmorph/iconify";

export const ${componentName} = iconify({
  defaultPalette: [${colors.map((color) => `"${color}"`).join(", ")}],
  renderSvg: ({ palette, size }) => (
    <svg width={size} height={size} viewBox="${svgInfo.viewBox}" fill="none">
${svgContent}
    </svg>
  ),
});
`;
}

interface IconGroup {
  components: string[];
  iconNames: string[];
  namespace?: string;
}

export async function generateIcons({
  source,
  target,
}: GenerateOptions): Promise<void> {
  const spinner = ora("Generating icon components...").start();
  let successCount = 0;
  let skipCount = 0;

  try {
    // Track all icon groups (root and subdirectories)
    const iconGroups = new Map<string, IconGroup>();
    iconGroups.set("root", { components: [], iconNames: [] });

    // Ensure target directory exists
    fs.mkdirSync(target, { recursive: true });

    // Process SVG files in root and subdirectories
    const processDirectory = async (dirPath: string, namespace?: string) => {
      const files = await glob("**/*.svg", { cwd: dirPath });
      const groupKey = namespace || "root";
      const group = iconGroups.get(groupKey) || {
        components: [],
        iconNames: [],
        namespace,
      };
      const targetDir = namespace ? path.join(target, namespace) : target;

      // Create target directory if it doesn't exist
      fs.mkdirSync(targetDir, { recursive: true });

      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const componentName = generateComponentName(file);
        const iconName = path.basename(file, ".svg").toLowerCase();
        const outputPath = path.join(targetDir, `${componentName}.tsx`);

        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          const svgInfo = parseSvg(content);
          const component = generateComponent(file, svgInfo);

          fs.writeFileSync(outputPath, component);
          group.components.push(componentName);
          group.iconNames.push(iconName);
          successCount++;
          spinner.text = chalk.gray(
            `Processing: ${namespace ? `${namespace}/` : ""}${componentName}`
          );
        } catch (error) {
          skipCount++;
          spinner.warn(
            chalk.yellow(
              `Skipped ${file}: ${error instanceof Error ? error.message : "Unknown error"}`
            )
          );
        }
      }

      iconGroups.set(groupKey, group);
    };

    // Process source directory
    await processDirectory(source);

    // Process subdirectories
    const subdirs = fs
      .readdirSync(source, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const subdir of subdirs) {
      await processDirectory(path.join(source, subdir), subdir);
    }

    // Generate index files for each group
    iconGroups.forEach((group, key) => {
      if (group.components.length === 0) return;

      const targetDir = key === "root" ? target : path.join(target, key);

      // Generate group-specific icon component
      if (key !== "root") {
        const capitalizedName = key.charAt(0).toUpperCase() + key.slice(1);
        const groupIconContent = `// This file is auto-generated. DO NOT EDIT IT MANUALLY.
import React from "react";
import type { IconComponentProps } from "@runmorph/iconify";
${group.components
  .map((component) => `import { ${component} } from "./${component}";`)
  .join("\n")}

const iconComponents = {
${group.components
  .map(
    (component) =>
      `  "${component.replace(/Icon$/, "").toLowerCase()}": ${component},`
  )
  .join("\n")}
} as const;

export type ${capitalizedName}IconName = keyof typeof iconComponents;
export const ${key}IconNames = Object.keys(iconComponents) as ${capitalizedName}IconName[];

export const ${capitalizedName}Icon = React.forwardRef<SVGSVGElement, IconComponentProps & { name: ${capitalizedName}IconName }>(
  ({ name, ...props }, ref) => {
    const IconComponent = iconComponents[name];
    
    if (!IconComponent) {
      console.warn(\`${capitalizedName}Icon "\${name}" not found\`);
      return null;
    }

    return React.createElement(IconComponent as any, { ...props, ref });
  }
);

${capitalizedName}Icon.displayName = "${capitalizedName}Icon";
`;
        fs.writeFileSync(
          path.join(targetDir, `${capitalizedName}Icon.tsx`),
          groupIconContent
        );
      }

      // Generate group index
      const indexContent = `// This file is auto-generated. DO NOT EDIT IT MANUALLY.
${group.components
  .map((component) => `export { ${component} } from "./${component}";`)
  .join("\n")}
${key !== "root" ? `\nexport { ${key.charAt(0).toUpperCase() + key.slice(1)}Icon } from "./${key.charAt(0).toUpperCase() + key.slice(1)}Icon";` : ""}
`;
      fs.writeFileSync(path.join(targetDir, "index.tsx"), indexContent);
    });

    // Generate main Icon component with namespace support
    const hasRootIcons = Boolean(iconGroups.get("root")?.components.length);
    const nonEmptyNamespaces = Array.from(iconGroups.entries())
      .filter(([key, group]) => key !== "root" && group.components.length > 0)
      .map(([key]) => key);

    const mainIconContent = `// This file is auto-generated. DO NOT EDIT IT MANUALLY.
import React from "react";
import type { IconComponentProps } from "@runmorph/iconify";
${Array.from(iconGroups.entries())
  .map(([key, group]) =>
    key === "root" && group.components.length > 0
      ? group.components
          .map((component) => `import { ${component} } from "./${component}";`)
          .join("\n")
      : key !== "root" && group.components.length > 0
        ? `import { ${key.charAt(0).toUpperCase() + key.slice(1)}Icon, type ${key.charAt(0).toUpperCase() + key.slice(1)}IconName } from "./${key}/${key.charAt(0).toUpperCase() + key.slice(1)}Icon";`
        : ""
  )
  .filter(Boolean)
  .join("\n")}

${
  hasRootIcons
    ? `const rootComponents = {
${
  iconGroups
    .get("root")
    ?.components.map(
      (component) =>
        `  "${component.replace(/Icon$/, "").toLowerCase()}": ${component},`
    )
    .join("\n") || ""
}
} as const;

type RootIconName = keyof typeof rootComponents;`
    : ""
}

// Define the structure of namespaced components first
type IconComponent = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<IconComponentProps & { name: string }> & 
  React.RefAttributes<SVGSVGElement>
>;

// Get non-empty namespaces
const namespaces = [${nonEmptyNamespaces.map((key) => `"${key}"`).join(", ")}] as const;
type Namespace = typeof namespaces[number];

${
  nonEmptyNamespaces.length > 0
    ? `// Create the namespaced components mapping
const namespacedComponents = {
${nonEmptyNamespaces
  .map((key) => {
    const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
    return `  "${key}": ${capitalizedKey}Icon,`;
  })
  .join("\n")}
} as const;

// Type for namespaced icon names
type NamespacedName<T extends Namespace> = \`\${T}::\${string}\`;
type NamespacedIconName = {
  [K in Namespace]: NamespacedName<K>;
}[Namespace];`
    : ""
}

// Combined icon name type
export type IconName = ${
      hasRootIcons && nonEmptyNamespaces.length
        ? "RootIconName | NamespacedIconName"
        : hasRootIcons
          ? "RootIconName"
          : nonEmptyNamespaces.length
            ? "NamespacedIconName"
            : "never"
    };

export const Icon = React.forwardRef<SVGSVGElement, IconComponentProps & { name: IconName }>(
  ({ name, ...props }, ref) => {
    ${
      nonEmptyNamespaces.length > 0
        ? `if (typeof name === "string" && name.includes("::")) {
      const [namespaceRaw, iconName] = name.split("::") as [
      Namespace,
      ConnectorIconName,
    ];
      const namespace = namespaceRaw as Namespace;
      
      if (!namespaces.includes(namespace)) {
        console.warn(\`Icon namespace "\${namespace}" not found\`);
        return null;
      }

      const NamespacedIcon = namespacedComponents[namespace];
      return <NamespacedIcon name={iconName} {...props} ref={ref} />;
    }`
        : ""
    }

    ${
      hasRootIcons
        ? `const IconComponent = rootComponents[name as RootIconName];
    
    if (!IconComponent) {
      console.warn(\`Icon "\${name}" not found\`);
      return null;
    }

    return React.createElement(IconComponent as any, { ...props, ref });`
        : `console.warn(\`Icon "\${name}" not found\`);
    return null;`
    }
  }
);

Icon.displayName = "Icon";
`;

    fs.writeFileSync(path.join(target, "Icon.tsx"), mainIconContent);

    // Generate main index.tsx
    const mainIndexContent = `// This file is auto-generated. DO NOT EDIT IT MANUALLY.
${Array.from(iconGroups.entries())
  .map(([key, group]) =>
    group.components.length === 0
      ? ""
      : key === "root"
        ? group.components
            .map(
              (component) => `export { ${component} } from "./${component}";`
            )
            .join("\n")
        : `export { ${key.charAt(0).toUpperCase() + key.slice(1)}Icon } from "./${key}/${key.charAt(0).toUpperCase() + key.slice(1)}Icon";`
  )
  .filter(Boolean)
  .join("\n")}

export { Icon } from "./Icon";
export type { IconComponentProps } from "@runmorph/iconify";
export type { IconName } from "./Icon";
`;

    fs.writeFileSync(path.join(target, "index.tsx"), mainIndexContent);

    spinner.succeed(
      chalk.green(
        `Successfully generated ${successCount} icon components (${skipCount} skipped)\n` +
          `📦 Generated:\n` +
          `   - Root index.tsx with exports\n` +
          `   - Main Icon.tsx component${nonEmptyNamespaces.length ? " with namespace support" : ""}\n` +
          nonEmptyNamespaces
            .map(
              (key) =>
                `   - ${key}/${key.charAt(0).toUpperCase() + key.slice(1)}Icon.tsx component`
            )
            .join("\n")
      )
    );
  } catch (error) {
    spinner.fail(chalk.red("Failed to generate icon components"));
    throw error;
  }
}
