import {
  ExtractConnectorSettings,
  RuntimeConnection,
  SubscribeToGlobalEvent,
} from "@runmorph/cdk";

import type { SalesforceConnector } from "../../connector";

import SalesforceGlobalEventMapper from "./mapper";

type InstalledSubscriberPackageQueryResponse = {
  done: boolean;
  records: Array<{
    Id: string;
    SubscriberPackageId: string;
    SubscriberPackageVersionId: string;
    MinPackageVersionId: string;
  }>;
};

async function isPackageVersionInstalled(
  connection: RuntimeConnection<any, any, any>,
  packageVersionId: string
): Promise<boolean> {
  const { data, error } =
    await connection.proxy<InstalledSubscriberPackageQueryResponse>({
      path: "/tooling/query",
      method: "GET",
      query: {
        q: `SELECT Id,SubscriberPackageId,SubscriberPackageVersionId,MinPackageVersionId FROM InstalledSubscriberPackage WHERE SubscriberPackageVersionId = '${packageVersionId}'`,
      },
    });

  if (error || !data.done) {
    return false;
  }
  return data.records.length > 0;
}

type PackageInstallRequestResponse = {
  id: string;
  success: boolean;
  errors: string[];
  warnings: string[];
  infos: string[];
};

async function installPackageVersion(
  connection: RuntimeConnection<any, any, any>,
  packageVersionId: string
): Promise<boolean> {
  const packageVersionIsinstalled = await isPackageVersionInstalled(
    connection,
    packageVersionId
  );
  if (!packageVersionIsinstalled) {
    const { data, error } =
      await connection.proxy<PackageInstallRequestResponse>({
        path: "/tooling/sobjects/PackageInstallRequest/",
        method: "POST",
        data: {
          SubscriberPackageVersionKey: packageVersionId,
          SecurityType: "Full",
          NameConflictResolution: "RenameMetadata",
        },
      });

    if (error || !data.success) {
      return false;
    }
    return true;
  }
  return true;
}

type RemoteSiteSettingQueryResponse = {
  done: boolean;
  records: {
    Id: string;
    EndpointUrl: string;
    IsActive: boolean;
  }[];
};

async function isRemoteSiteWhitelisted({
  connection,
  remoteSite,
}: {
  connection: RuntimeConnection<any, any, any>;
  remoteSite: RemoteSiteParams;
}): Promise<boolean> {
  const { data, error } =
    await connection.proxy<RemoteSiteSettingQueryResponse>({
      path: "/tooling/query",
      method: "GET",
      query: {
        q: `SELECT Id,EndpointUrl,IsActive FROM RemoteSiteSetting WHERE EndpointUrl = '${remoteSite.url}' AND IsActive = TRUE`,
      },
    });
  if (error || !data.done) {
    return false;
  }
  return data.records.length > 0;
}

type WhitelistMorphAPIResponse = {
  id: string;
  success: boolean;
};

type RemoteSiteParams = {
  url: string;
  name: string;
  description: string;
};

async function whitelistRemoteSite({
  connection,
  remoteSite,
}: {
  connection: RuntimeConnection<any, any, any>;
  remoteSite: RemoteSiteParams;
}): Promise<boolean> {
  const remoteSiteIsWhitelisted = await isRemoteSiteWhitelisted({
    connection,
    remoteSite,
  });
  if (!remoteSiteIsWhitelisted) {
    const { data, error } = await connection.proxy<WhitelistMorphAPIResponse>({
      path: "/tooling/sobjects/RemoteSiteSetting",
      method: "POST",
      data: {
        FullName: addRandomKey(remoteSite.name),
        Metadata: {
          description: remoteSite.description,
          disableProtocolSecurity: false,
          isActive: true,
          url: remoteSite.url,
        },
      },
    });

    if (error || !data.success) {
      return false;
    }
  }
  return true;
}

type TrustedSiteQueryResponse = {
  done: boolean;
  records: {
    Id: string;
    EndpointUrl: string;
    IsActive: boolean;
    Context: string;
    IsApplicableToConnectSrc: boolean;
    IsApplicableToImgSrc: boolean;
    IsApplicableToStyleSrc: boolean;
    IsApplicableToFontSrc: boolean;
    IsApplicableToFrameSrc: boolean;
    IsApplicableToMediaSrc: boolean;
  }[];
};

type TrustedSiteParams = {
  url: string;
  name: string;
  description: string;
  applicableTo: Array<
    "connectSrc" | "imgSrc" | "styleSrc" | "fontSrc" | "frameSrc" | "mediaSrc"
  >;
};

async function isTrustedSiteWhitelisted({
  connection,
  trustedSite,
}: {
  connection: RuntimeConnection<any, any, any>;
  trustedSite: TrustedSiteParams;
}): Promise<boolean> {
  const { data, error } = await connection.proxy<TrustedSiteQueryResponse>({
    path: "/tooling/query",
    method: "GET",
    query: {
      q: `SELECT Id, EndpointUrl, IsActive, Context, 
          IsApplicableToConnectSrc, IsApplicableToImgSrc, 
          IsApplicableToStyleSrc, IsApplicableToFontSrc, 
          IsApplicableToFrameSrc, IsApplicableToMediaSrc 
          FROM CspTrustedSite 
          WHERE EndpointUrl = '${trustedSite.url}' AND IsActive = TRUE`,
    },
  });

  if (error || !data.done) {
    return false;
  }

  // Check if we have any matching records
  const matchingRecord = data.records.find((record) => {
    // Verify all requested resources are enabled
    return trustedSite.applicableTo.every((resource) => {
      switch (resource) {
        case "connectSrc":
          return record.IsApplicableToConnectSrc;
        case "imgSrc":
          return record.IsApplicableToImgSrc;
        case "styleSrc":
          return record.IsApplicableToStyleSrc;
        case "fontSrc":
          return record.IsApplicableToFontSrc;
        case "frameSrc":
          return record.IsApplicableToFrameSrc;
        case "mediaSrc":
          return record.IsApplicableToMediaSrc;
        default:
          return false;
      }
    });
  });

  return !!matchingRecord;
}

type WhitelistTrustedSiteResponse = {
  id: string;
  success: boolean;
};

function addRandomKey(name: string): string {
  return `${name}_${Math.random().toString(36).substring(2, 7)}`;
}

async function whitelistTrustedSite({
  connection,
  trustedSite,
}: {
  connection: RuntimeConnection<any, any, any>;
  trustedSite: TrustedSiteParams;
}): Promise<boolean> {
  const trustedSiteIsWhitelisted = await isTrustedSiteWhitelisted({
    connection,
    trustedSite,
  });

  if (!trustedSiteIsWhitelisted) {
    const { data, error } =
      await connection.proxy<WhitelistTrustedSiteResponse>({
        path: "/tooling/sobjects/CspTrustedSite",
        method: "POST",
        data: {
          DeveloperName: addRandomKey(trustedSite.name),
          EndpointUrl: trustedSite.url,
          Description: trustedSite.description,
          IsActive: true,
          Context: "All",
          IsApplicableToConnectSrc:
            trustedSite.applicableTo.includes("connectSrc"),
          IsApplicableToImgSrc: trustedSite.applicableTo.includes("imgSrc"),
          IsApplicableToStyleSrc: trustedSite.applicableTo.includes("styleSrc"),
          IsApplicableToFontSrc: trustedSite.applicableTo.includes("fontSrc"),
          IsApplicableToFrameSrc: trustedSite.applicableTo.includes("frameSrc"),
          IsApplicableToMediaSrc: trustedSite.applicableTo.includes("mediaSrc"),
        },
      });

    if (error || !data.success) {
      return false;
    }
  }
  return true;
}

async function whitelistMorphAPI({
  connection,
}: {
  connection: RuntimeConnection<any, any, any>;
}): Promise<boolean> {
  const name = "MorphPublicAPI";
  const description = "Morph Public API (runmorph.dev)";
  const url = "https://api.runmorph.dev";

  // Whitelist as remote site
  const remoteSuccess = await whitelistRemoteSite({
    connection,
    remoteSite: {
      name,
      description,
      url,
    },
  });

  // Whitelist as trusted site with required permissions
  const trustedSuccess = await whitelistTrustedSite({
    connection,
    trustedSite: {
      name,
      description,
      url,
      applicableTo: ["connectSrc", "frameSrc", "imgSrc"],
    },
  });

  return remoteSuccess && trustedSuccess;
}

export default new SubscribeToGlobalEvent({
  globalEventMapper: SalesforceGlobalEventMapper,
  handler: async (connection, { route }) => {
    if (route === "cardView") {
      const connector = connection.getConnector<SalesforceConnector>();
      const cardViewPackageVersionId = connector.getSetting(
        "cardViewPackageVersionId"
      );
      const cardViewPackageIframeDomains = connector.getSetting(
        "cardViewPackageIframeDomains"
      );

      if (!cardViewPackageVersionId) {
        return {
          error: {
            code: "CONNECTOR::BAD_CONFIGURATION",
            message: `Missing cardViewPackageVersionId seeting.`,
          },
        };
      }

      // Install card view package
      const packageInstalled = await installPackageVersion(
        connection,
        cardViewPackageVersionId
      );
      if (!packageInstalled) {
        return {
          error: {
            code: "CONNECTOR::WEBHOOK::SUBSCRIPTION_FAILED",
            message: `Couldn't install cardViewPackageVersionId ${cardViewPackageVersionId}`,
          },
        };
      }

      // Whitelist morph public API
      const morphApiWhitelisted = await whitelistMorphAPI({ connection });
      if (!morphApiWhitelisted) {
        return {
          error: {
            code: "CONNECTOR::WEBHOOK::SUBSCRIPTION_FAILED",
            message: `Couldn't withelist Morph Public API domain`,
          },
        };
      }

      if (cardViewPackageIframeDomains) {
        const iframeDomains = cardViewPackageIframeDomains
          .split(",")
          .map((d) => d.trim());

        for (const domain of iframeDomains) {
          const host = new URL(domain).hostname;
          const hostName = host
            .split(".")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join("");

          const iframeWhitelisted = await whitelistTrustedSite({
            connection,
            trustedSite: {
              name: `CardViewWidgetIFrame${hostName}`,
              description: `Card View Widget iFrame Domain (${host})`,
              url: domain,
              applicableTo: ["frameSrc", "imgSrc"],
            },
          });
          if (!iframeWhitelisted) {
            return {
              error: {
                code: "CONNECTOR::WEBHOOK::SUBSCRIPTION_FAILED",
                message: `Couldn't withelist iframe domain ${domain}`,
              },
            };
          }
        }
      }

      const instanceUrl = await connection.getMetadata("instanceUrl");

      const organizationDomain = instanceUrl
        ? new URL(instanceUrl).hostname.split(".")[0]
        : undefined;

      if (!organizationDomain) {
        return {
          error: {
            code: "CONNECTOR::WEBHOOK::SUBSCRIPTION_FAILED",
            message:
              "Could not determine organization domain from instance URL",
          },
        };
      }

      return {
        identifierKey: organizationDomain, // TODO: define identierKey composable (portalId, globalRoute, ...) so it become typesafe across sub and mapper
      };
    } else {
      // TODO : if route infered proeperly, this shouldn't be necessary
      return {
        error: {
          code: "CONNECTOR::WEBHOOKS_NOT_SUPPORTED",
          message: `The global webhook route '${route}' does not exist on the HubSpot connector.`,
        },
      };
    }
  },
});
