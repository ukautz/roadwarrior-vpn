import { TerraformOutput } from "cdktf";
import { App } from "./core/app";
import { Stack } from "./core/stack";
import * as cloudinit from "../.gen/providers/cloudinit";
import * as digitalocean from "../.gen/providers/digitalocean";
import * as fs from "fs";
import {
  WireguardCloudInit,
  WireguardCloudInitOptions,
} from "./wireguard-cloud-init";

export interface DigitalOceanStackOptions extends WireguardCloudInitOptions {
  digitalOceanToken: string;
  serverImage: string;
  serverSize: string;
  serverRegion: string;
  sshKeyPath: string;
}

export class DigitalOceanStack extends Stack {
  constructor(scope: App, name: string, options: DigitalOceanStackOptions) {
    super(scope, name);

    new digitalocean.DigitaloceanProvider(this, "CloudProvider", {
      token: options.digitalOceanToken,
    });

    new cloudinit.CloudinitProvider(this, "CloudInitProvider");

    const publicKey = fs.readFileSync(options.sshKeyPath, "utf8");
    const sshKey = new digitalocean.SshKey(this, "SshKey", {
      name: `${name} Key`,
      publicKey,
    });

    const userData = new WireguardCloudInit(this, "WireguardCloudInit", {
      ...options,
      base64Encode: false,
    });

    const server = new digitalocean.Droplet(this, "VpnServer", {
      name: "vpn-server",
      image: options.serverImage,
      size: options.serverSize,
      region: options.serverRegion,
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
