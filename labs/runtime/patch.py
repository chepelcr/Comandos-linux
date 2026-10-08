import pathlib,sys
root=pathlib.Path(sys.argv[1])
p=root/'cmd/create-spec/main.go'
s=p.read_text()
if 'ctdoci.WithPrivileged' not in s:
 s=s.replace('ctdoci.WithNewPrivileges, // TODO: make it configurable', 'ctdoci.WithNewPrivileges,\n        ctdoci.WithPrivileged, // Privileged only inside the isolated emulated guest.')
if 'Destination: \"/opt/course/bridge\"' not in s:s=s.replace('// TODO: ports','s.Mounts = append(s.Mounts, specs.Mount{Destination: "/opt/course/bridge", Type: "bind", Source: "/mnt/wasi1", Options: []string{"bind", "rw"}})\n    // TODO: ports')
p.write_text(s)
p=root/'config/qemu/linux_x86_config';s=p.read_text()
settings=['NETFILTER','NETFILTER_ADVANCED','NF_CONNTRACK','NETFILTER_XTABLES','NETFILTER_XT_MATCH_CONNTRACK','NETFILTER_XT_MATCH_LIMIT','NETFILTER_XT_MATCH_MULTIPORT','NETFILTER_XT_TARGET_LOG','IP_NF_IPTABLES','IP_NF_FILTER','IP_NF_TARGET_REJECT','NF_TABLES','NFT_COMPAT','NF_TABLES_INET','NF_TABLES_IPV4','NFT_CT','NFT_LOG','NFT_LIMIT','NFT_REJECT','NFT_REJECT_INET','IP6_NF_IPTABLES','IP6_NF_FILTER','IP6_NF_TARGET_REJECT','NETFILTER_XT_MATCH_ADDRTYPE','NETFILTER_XT_TARGET_CONNMARK','NETFILTER_XT_MATCH_COMMENT']
for key in settings:
 s=s.replace(f'# CONFIG_{key} is not set',f'CONFIG_{key}=y')
 if f'CONFIG_{key}=' not in s:s+=f'\nCONFIG_{key}=y\n'
p.write_text(s)
