import { Construct } from "constructs";
import * as cloudinit from "../.gen/providers/cloudinit";

const defaultServerAddress = "192.168.6.1/24";
const defaultServerPort = "51397";
const defaultClientAddress = "192.168.6.10/24";

export interface WireguardCloudInitProps {
  vpnServerAddress?: string;
  vpnServerPort?: string;
  vpnServerPrivateKey: string;
  vpnClientPublicKey: string;
  vpnClientAddress?: string;
  base64Encode?: boolean;
}

export class WireguardCloudInit extends cloudinit.Config {
  constructor(scope: Construct, name: string, props: WireguardCloudInitProps) {
    super(scope, name, {
      base64Encode: props.base64Encode ?? true,
      gzip: props.base64Encode ?? true,
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
Address = ${props.vpnServerAddress ?? defaultServerAddress}
ListenPort = ${props.vpnServerPort ?? defaultServerPort}
PrivateKey = ${props.vpnServerPrivateKey}
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = ${props.vpnClientPublicKey}
AllowedIPs = ${props.vpnClientAddress ?? defaultClientAddress}
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
