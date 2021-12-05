import { Construct } from "constructs";
import * as cloudinit from "../.gen/providers/cloudinit";

export interface WireguardCloudInitOptions {
  vpnServerAddress: string;
  vpnServerPort: string;
  vpnServerPrivateKey: string;
  vpnClientPublicKey: string;
  vpnClientAddress: string;
  base64Encode?: boolean;
}

export class WireguardCloudInit extends cloudinit.Config {
  constructor(
    scope: Construct,
    name: string,
    options: WireguardCloudInitOptions
  ) {
    super(scope, name, {
      base64Encode: options.base64Encode ?? true,
      gzip: options.base64Encode ?? true,
      part: [
        {
          contentType: "text/cloud-config",
          content: `#cloud-config
apt_upgrade: true
packages:
  - wireguard`,
        },
        {
          contentType: "text/x-shellscript",
          content: `#!/bin/bash

mkdir -p /etc/wireguard
cd /etc/wireguard

umask 077

cat > wg0.conf <<- EOF
[Interface]
Address = ${options.vpnServerAddress}
ListenPort = ${options.vpnServerPort}
PrivateKey = ${options.vpnServerPrivateKey}
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = ${options.vpnClientPublicKey}
AllowedIPs = ${options.vpnClientAddress}
EOF

umask 022
sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.d/forwarding.conf

systemctl enable wg-quick@wg0
systemctl start wg-quick@wg0`,
        },
      ],
    });
  }
}
