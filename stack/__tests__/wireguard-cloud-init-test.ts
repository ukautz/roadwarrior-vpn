import { Testing } from "cdktf";
import "cdktf/lib/testing/adapters/jest"; // Load types for expect matchers
import { WireguardCloudInit } from "../lib/wireguard-cloud-init";

describe("Wireguard Cloud Init", () => {
  it("Renders as expected", () => {
    expect(
      Testing.synthScope((scope) => {
        new WireguardCloudInit(scope, "Resource", {
          vpnClientAddress: "10.0.0.10/24",
          vpnClientPublicKey: "pub-key",
          vpnServerAddress: "10.0.0.1/24",
          vpnServerPort: "12345",
          vpnServerPrivateKey: "priv-key",
        });
      })
    ).toMatchSnapshot();
  });
});
