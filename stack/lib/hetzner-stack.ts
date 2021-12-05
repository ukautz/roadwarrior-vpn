import { TerraformOutput } from "cdktf";
import { App } from "./core/app";
import { Stack } from "./core/stack";
import * as cloudinit from "../.gen/providers/cloudinit";
import * as hcloud from "../.gen/providers/hcloud";
import * as fs from "fs";
import {
  WireguardCloudInit,
  WireguardCloudInitOptions,
} from "./wireguard-cloud-init";

export interface HetznerStackOptions extends WireguardCloudInitOptions {
  hcloudToken: string;
  serverImage: string;
  serverType: string;
  serverLocation: string;
  sshKeyPath: string;
}

export class HetznerStack extends Stack {
  constructor(scope: App, name: string, options: HetznerStackOptions) {
    super(scope, name);

    new hcloud.HcloudProvider(this, "CloudProvider", {
      token: options.hcloudToken,
    });

    new cloudinit.CloudinitProvider(this, "CloudInitProvider");

    const publicKey = fs.readFileSync(options.sshKeyPath, "utf8");
    const sshKey = new hcloud.SshKeyA(this, "SshKey", {
      name: `${name} Key`,
      publicKey,
    });

    const userData = new WireguardCloudInit(this, "WireguardCloudInit", {
      ...options,
      base64Encode: true,
    });

    const server = new hcloud.Server(this, "VpnServer", {
      name: "vpn-server",
      image: options.serverImage,
      serverType: options.serverType,
      location: options.serverLocation,
      sshKeys: [sshKey.id],
      userData: userData.rendered,
    });

    [
      ["server-id", server.id],
      ["server-ip", server.ipv4Address],
      ["server-status", server.status],
      ["server-vpn-port", options.vpnServerPort],
      ["server-vpn-network", options.vpnServerAddress],
      ["client-vpn-address", options.vpnClientAddress],
    ].map(
      ([k, v]) =>
        new TerraformOutput(this, k, {
          value: v,
        })
    );
  }
}
