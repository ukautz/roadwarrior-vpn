import { TerraformOutput, TerraformStack } from "cdktf";
import * as cloudinit from "../.gen/providers/cloudinit";
import * as digitalocean from "../.gen/providers/digitalocean";
import * as fs from "fs";
import {
  WireguardCloudInit,
  WireguardCloudInitProps,
} from "./wireguard-cloud-init";
import { Construct } from "constructs";

const defaultServerImage = "ubuntu-20-04-x64";
const defaultServerSize = "s-1vcpu-1gb";
const defaultServerRegion = "fra1";

export interface DigitalOceanStackProps extends WireguardCloudInitProps {
  digitalOceanToken: string;
  sshKeyPath: string;
  serverImage?: string;
  serverSize?: string;
  serverRegion?: string;
}

export class DigitalOceanStack extends TerraformStack {
  constructor(scope: Construct, name: string, props: DigitalOceanStackProps) {
    super(scope, name);

    new digitalocean.DigitaloceanProvider(this, "CloudProvider", {
      token: props.digitalOceanToken,
    });

    new cloudinit.CloudinitProvider(this, "CloudInitProvider");

    const publicKey = fs.readFileSync(props.sshKeyPath, "utf8");
    const sshKey = new digitalocean.SshKey(this, "SshKey", {
      name: `${name} Key`,
      publicKey,
    });

    const userData = new WireguardCloudInit(this, "WireguardCloudInit", {
      ...props,
      base64Encode: false,
    });

    const server = new digitalocean.Droplet(this, "VpnServer", {
      name: "vpn-server",
      image: props.serverImage ?? defaultServerImage,
      size: props.serverSize ?? defaultServerSize,
      region: props.serverRegion ?? defaultServerRegion,
      sshKeys: [sshKey.id],
      userData: userData.rendered,
    });

    [
      ["server-id", server.id],
      ["server-ip", server.ipv4Address],
      ["server-status", server.status],
      ["server-vpn-port", userData.serverPort],
      ["server-vpn-network", userData.serverAddress],
      ["client-vpn-address", userData.clientAddress],
    ].map(
      ([k, v]) =>
        new TerraformOutput(this, k as string, {
          value: v,
        })
    );
  }
}
