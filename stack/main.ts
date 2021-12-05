import { App } from "./lib/core/app";
import { HetznerStack } from "./lib/hetzner-stack";
import * as path from "path";
import { DigitalOceanStack } from "./lib/digitalocean-stack";

const app = new App();

const sshKeyPath = app.context(
  "sshKeyPath",
  path.join(process.env.HOME as string, ".ssh", "id_ecdsa.pub")
);
const vpnServerPrivateKey = app.context("vpnServerPrivateKey");
const vpnServerAddress = app.context("vpnNetwork", "192.168.6.1/24");
const vpnServerPort = app.context("vpnPort", "51397");
const vpnClientPublicKey = app.context("vpnClientPublicKey");
const vpnClientAddress = app.context("vpnNetwork", "192.168.6.10/24");
const provider = app.context("provider", "hetzner");

switch (provider) {
  case "hetzner":
    new HetznerStack(app, "VpnStack", {
      hcloudToken: app.context("hcloudToken"),
      serverImage: app.context("serverImage", "ubuntu-20.04"),
      serverType: app.context("serverType", "cx11"),
      serverLocation: app.context("serverLocation", "nbg1"),
      sshKeyPath,
      vpnClientAddress,
      vpnClientPublicKey,
      vpnServerAddress,
      vpnServerPort,
      vpnServerPrivateKey,
    });
    break;
  case "digitalocean":
    new DigitalOceanStack(app, "VpnStack", {
      digitalOceanToken: app.context("digitalOceanToken"),
      serverImage: app.context("serverImage", "ubuntu-20-04-x64"),
      serverSize: app.context("serverSize", "s-1vcpu-1gb"),
      serverRegion: app.context("serverRegion", "fra1"),
      sshKeyPath,
      vpnClientAddress,
      vpnClientPublicKey,
      vpnServerAddress,
      vpnServerPort,
      vpnServerPrivateKey,
    });
    break;
  default:
    throw new Error(
      `Unsupported provider ${provider}. Use hetzner or digitalocean`
    );
}

app.synth();
