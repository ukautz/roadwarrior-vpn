import { App } from "./lib/core/app";
import { HetznerStack } from "./lib/hetzner-stack";
import * as path from "path";
import { DigitalOceanStack } from "./lib/digitalocean-stack";

const app = new App();

const props = {
  /*
  ---
  REQUIRED
  ---
  */

  provider: app.mustContext("provider"),
  sshKeyPath: app.mustContext(
    "sshKeyPath",
    path.join(process.env.HOME as string, ".ssh", "id_ecdsa.pub")
  ),
  vpnServerPrivateKey: app.mustContext("vpnServerPrivateKey"),
  vpnClientPublicKey: app.mustContext("vpnClientPublicKey"),

  /*
  ---
  OPTIONAL
  ---
  */
  sshUser: app.context("sshUser"),
  vpnServerAddress: app.context("vpnServerAddress"),
  vpnServerPort: app.context("vpnServerPort"),
  vpnClientAddress: app.context("vpnClientAddress"),
};

switch (props.provider) {
  case "hetzner":
    new HetznerStack(app, "VpnStack", {
      hcloudToken: app.mustContext("hcloudToken"),
      serverImage: app.context("serverImage"),
      serverType: app.context("serverType"),
      serverLocation: app.context("serverLocation"),
      ...props,
    });
    break;
  case "digitalocean":
    new DigitalOceanStack(app, "VpnStack", {
      digitalOceanToken: app.mustContext("digitalOceanToken"),
      serverImage: app.context("serverImage"),
      serverSize: app.context("serverSize"),
      serverRegion: app.context("serverRegion"),
      ...props,
    });
    break;
  default:
    throw new Error(
      `Unsupported provider ${props.provider}. Use hetzner or digitalocean`
    );
}

app.synth();
