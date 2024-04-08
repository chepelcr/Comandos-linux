#!/bin/bash
# IP permitida
#ip_permitida11="XX.XX.XX.XX"
#ip_permitida12="YY.YY.YY.YY"

# Limpia la pantalla.
clear
# Borrar reglas básicas
iptables -F > /dev/null 2>&1
iptables -X > /dev/null 2>&1
#
# Cerrar todas las conexiones
iptables -P INPUT DROP
#
# Prohibición de redireccionamiento
iptables -P FORWARD DROP
#
# Permitir todas las conexiones salientes
iptables -P OUTPUT ACCEPT
#
#Permitir  conexiones activas solicitadas al exterior
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
#
# Permitir Puertos Solicitados - Apertura por número de puerto
iptables -A INPUT -p TCP --dport 80 -j ACCEPT
iptables -A INPUT -p TCP --dport 443 -j ACCEPT

#Permitir acceso a base de datos
#iptables -A INPUT -p TCP --dport 3306 -j ACCEPT
#iptables -A INPUT -p TCP --dport 3307 -j ACCEPT
#
# Apertura por número de puerto y filtro por IP
# Administración Remota por SSH
#iptables -A INPUT -s $ip_permitida1 -p TCP --dport 22 -j ACCEPT
iptables -A INPUT -p TCP --dport 22 -j ACCEPT
#
# Permitir PING
#iptables -A INPUT -s $ip_permitida1 -p icmp --icmp-type echo-reply -j ACCEPT
#iptables -A INPUT -s $ip_permitida1 -p icmp --icmp-type echo-request -j ACCEPT
#
#Permitir localhost
iptables -A INPUT -i lo -j ACCEPT
#
#registrar todos los eventos
iptables -A INPUT -j LOG --log-level 7 
# Fin del Script

