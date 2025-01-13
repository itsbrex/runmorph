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
  connection: RuntimeConnection<any, any>,
  packageVersionId: string,
): Promise<boolean> {
  console.log(
    "[isPackageVersionInstalled] Checking package:",
    packageVersionId,
  );

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
  console.log("[isPackageVersionInstalled] Response:", { data, error });
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
  connection: RuntimeConnection<any, any>,
  packageVersionId: string,
): Promise<boolean> {
  console.log("[installPackageVersion] Installing package:", packageVersionId);

  const { data, error } = await connection.proxy<PackageInstallRequestResponse>(
    {
      path: "/tooling/sobjects/PackageInstallRequest/",
      method: "POST",
      data: {
        SubscriberPackageVersionKey: packageVersionId,
        SecurityType: "Full",
        NameConflictResolution: "RenameMetadata",
      },
    },
  );

  if (error || !data.success) {
    return false;
  }
  console.log("[installPackageVersion] Response:", { data, error });
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

async function isMorphAPIWhitelisted(
  connection: RuntimeConnection<any, any>,
): Promise<boolean> {
  console.log("[isMorphAPIWhitelisted] Checking if API is whitelisted");

  const { data, error } =
    await connection.proxy<RemoteSiteSettingQueryResponse>({
      path: "/tooling/query",
      method: "GET",
      query: {
        q: "SELECT Id,EndpointUrl,IsActive FROM RemoteSiteSetting WHERE EndpointUrl = 'https://api.runmorph.dev' AND IsActive = TRUE",
      },
    });

  if (error || !data.done) {
    return false;
  }
  console.log("[isMorphAPIWhitelisted] Response:", { data, error });
  return data.records.length > 0;
}

type WhitelistMorphAPIResponse = {
  id: string;
  success: boolean;
};

async function whitelistMorphPublicAPI(
  connection: RuntimeConnection<any, any>,
): Promise<boolean> {
  console.log("[whitelistMorphPublicAPI] Attempting to whitelist API");

  const { data, error } = await connection.proxy<WhitelistMorphAPIResponse>({
    path: "/tooling/sobjects/RemoteSiteSetting",
    method: "POST",
    data: {
      FullName: "MorphPublicAPI",
      Metadata: {
        description: "Morph Public API (runmorph.dev)",
        disableProtocolSecurity: false,
        isActive: true,
        url: "https://api.runmorph.dev",
      },
    },
  });

  if (error || !data.success) {
    return false;
  }
  console.log("[whitelistMorphPublicAPI] Response:", { data, error });
  return true;
}

export default new SubscribeToGlobalEvent({
  globalEventMapper: SalesforceGlobalEventMapper,
  handler: async (connection, { globalRoute, settings }) => {
    if (globalRoute === "cardView") {
      const { cardViewPackageVersionId } =
        settings as ExtractConnectorSettings<SalesforceConnector>;

      // Install card view package
      if (
        !(await isPackageVersionInstalled(connection, cardViewPackageVersionId))
      ) {
        await installPackageVersion(connection, cardViewPackageVersionId);
      }

      // Whitelist morph public API
      if (!(await isMorphAPIWhitelisted(connection))) {
        await whitelistMorphPublicAPI(connection);
      }

      const instanceUrl = await connection.getMetadata("instanceUrl");

      const organizationDomain = instanceUrl
        ? new URL(instanceUrl).hostname.split(".")[0]
        : undefined;

      return {
        identifierKey: `${organizationDomain}-${globalRoute}-widgetCardView-created`, // TODO: define identierKey composable (portalId, globalRoute, ...) so it become typesafe across sub and mapper
      };
    } else {
      // TODO : if route infered proeperly, this shouldn't be necessary
      return {
        error: {
          code: "CONNECTOR::WEBHOOKS_NOT_SUPPORTED",
          message: `The global webhook route '${globalRoute}' does not exist on the HubSpot connector.`,
        },
      };
    }
  },
});
