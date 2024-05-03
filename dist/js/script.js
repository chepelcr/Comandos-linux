let elemento = '';
let ejemplo_activo = '';
let texto_copiar = '';


const Toast = Swal.mixin({
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});


let example_txt = [];

example_txt[0] = '# LAMP' + '\n' +
    '# Un servidor  "LAMP" es un conjunto de un sistema operativo mas software' + '\n' +
    '# adicional de código abierto, que permiten a dicho servidor alojar' + '\n' +
    '# sitios web dinámicos y/o aplicaciones web.' + '\n' +
    '# LAMP es un acrónimo que representa el sistema operativo GNU/Linux, el servidor' + '\n' +
    '# web Apache, con los datos del sitio almacenados en una base de datos' + '\n' +
    '# MySQL/MariaDB y PHP que procesa el contenido dinámico.(Javascript, llamada a' + '\n' +
    '# bases de datos, etc)' + '\n' +
    '# \n' +
    '# \n' +
    '# \n' +
    '# Instalación de webserver' + '\n' +
    'sudo apt install apache2' + '\n' +
    'sudo a2enmod rewrite' + '\n' +
    'sudo systemctl restart apache2' + '\n' +
    '# Accedemos en un browser ' + '\n' +
    'http://ip_server_remoto (Se puede usar comando "ip a" para ver su IP si la olvido)';

example_txt[1] = '# \n' + '# Agregar el repositorio de php' + '\n' +
    'sudo add-apt-repository ppa:ondrej/php' + '\n' + '# \n' +
    '# Instalamos php y las dependencias recomendadas para que php pueda' + '\n' +
    '# interactuar con el webserver y la base de datos ' + '\n' +
    'sudo apt install php8.1' + '\n' + 'sudo apt install php8.1-fpm libapache2-mod-fcgid' + '\n' +
    'sudo apt install -y php8.1-mysql php8.1-dom php8.1-simplexml php8.1-ssh2 php8.1-xml php8.1-xmlreader php8.1-curl php8.1-ftp php8.1-gd  php8.1-iconv php8.1-imagick php8.1-mbstring php8.1-posix php8.1-sockets php8.1-tokenizer' + '\n' +
    'sudo apt install -y php8.1-mysqli php8.1-pdo  php8.1-sqlite3 php8.1-ctype php8.1-fileinfo php8.1-zip php8.1-exif' + '\n' +
    'sudo apt install php8.1-{cli,fpm,common,intl,tidy,soap,bcmath,xmlrpc}';

example_txt[2] = '# Procedemos a crear un usuario y lo agregamos al grupo sudo' +
    '\n' + 'adduser sysadmin && usermod -a -G sudo sysadmin';

example_txt[3] = '# Instalación de servidor de base de datos' + '\n' +
    'sudo apt install mariadb-server' + '\n' +
    '# Si no se ha corrido todavía, Lo primero que debemos hacer es correr el' +
    '\n' + '# siguiente comando en la terminal:' + '\n' +
    'sudo mysql_secure_installation' + '\n' + '# ' + '\n' +
    '# Si todavía no se ha configurado el password del usuario root de mysql' + '\n' +
    '# se procede a configurarlo  y se da si a todas las otras opciones solicitadas.' + '\n' +
    '# ' + '\n' +
    '# Una vez completado el comando anterior se procede a ingresar a la consola de mysql,' + '\n' +
    '# la opción -u indica el usuario y -p para' + '\n' +
    '# solicitar el password interactivamente.' + '\n' +
    'sudo mysql -u root -p' + '\n' +
    '# Usamos el password de ubuntu_sysadmin o el que acabamos de crear para la base de datos' + '\n' +
    '# ' + '\n' +
    '# Cambiar contraseña de un usuario' + '\n' +
    'ALTER USER \'user\'@\'localhost\' IDENTIFIED BY \'new_password\';' + '\n' +
    '# ' + '\n' +
    '# agregar un nuevo usuario' + '\n' +
    'CREATE USER \'new_user\'@\'localhost\' IDENTIFIED BY \'password\';' + '\n' +
    '# ' + '\n' +
    '# dar permisos al usuario' + '\n' +
    'GRANT ALL PRIVILEGES ON *.* TO \'new_user\'@\'localhost\' WITH GRANT OPTION;' + '\n' +
    '# ' + '\n' +
    '# recargar privilegios' + '\n' +
    'FLUSH PRIVILEGES;' + '\n' +
    '# ' + '\n' +
    '# salir' + '\n' +
    'exit;';

example_txt[4] = '# Crear un nuevo archivo con VI.' +
    '\n' + 'vi [nombreArchivo]' +
    '\n' + '# ' +
    '\n' + '# Tutorial de vim en español (Otros idiomas disponibles).' +
    '\n' + 'vimtutor es' +
    '\n' + '# ' +
    '\n' + '# Atajos del teclado' +
    '\n' + 'i: Entrar al modo de edición en el cursor' +
    '\n' + 'I: Entrar al modo edición al inicio de la linea.' +
    '\n' + '# ' +
    '\n' + 'a: Insertar justo después del cursor.' +
    '\n' + 'A: Insertar al final de la linea' +
    '\n' + '# ' +
    '\n' + 'O: Insertar una linea hacia arriba.' +
    '\n' + '# ' +
    '\n' + 'j: Una linea hacia abajo.' +
    '\n' + 'k: Una linea hacia arriba.' +
    '\n' + 'o: Insertar una linea al final del documento.' +
    '\n' + '# ' +
    '\n' + 'l: Carácter a la derecha.' +
    '\n' + 'h: Carácter a la izquierda.' +
    '\n' + 'w: Inicio de la palabra de adelante' +
    '\n' + 'b: Inicio de la palabra anterior.' +
    '\n' + '# ' +
    '\n' + 'G: Ir a una linea específica.' +
    '\n' + 'gg: Ir al inicio del texto' +
    '\n' + 'GG: Ir al final del documento.' +
    '\n' + '# ' +
    '\n' + 'y: Copiar.' +
    '\n' + 'yy: Copiar toda la linea' +
    '\n' + '3yy: Copiar tres lineas' +
    '\n' + 'yw: Copiar la palabra actual.' +
    '\n' + 'y3w: Copiar las siguientes tres palabras.' +
    '\n' + 'y^: Copiar del punto actual al inicio de la linea.' +
    '\n' + '# ' +
    '\n' + 'cc: Change (replace) a line of the document.' +
    '\n' + 'p | P: Pegar (p pega con un espacio entre palabras | P pega sin espacio)' +
    '\n' + 'x: Borrar letra por letra.' +
    '\n' + '# ' +
    '\n' + 'd: Cortar o borrar.' +
    '\n' + 'dd: Borrar toda la linea' +
    '\n' + '3dd: Borrar tres lineas' +
    '\n' + 'dw: Cortar la palabra actual.' +
    '\n' + 'd3w: Cortar las siguientes tres palabras.' +
    '\n' + 'd^: Cortar del punto actual al inicio de la linea.' +
    '\n' + '# ' + '\n' + 'u: Deshacer el último cambio.' +
    '\n' + 'r + Letra: Reemplazar una letra específica.' +
    '\n' + '# ' + '\n' + '/Palabra: Buscar en el documento' +
    '\n' + 'n:Ir al resultado siguiente.' +
    '\n' + '# ' +
    '\n' + '$: Ir al final de la linea.' +
    '\n' + '^: Ir al inicio de la linea.' +
    '\n' + '# ' + '\n' + ':w = Guardar.' +
    '\n' + 'ZZ | :wq = Guardar y salir.' +
    '\n' + ':q = Salir sin hacer cambios al documento' +
    '\n' + ':q!: Salir sin guardar.' +
    '\n' + '# ' +
    '\n' + ':set nu = Ver números de linea' +
    '\n' + ':colorscheme: Cambiar el color de vi.' +
    '\n' + '# ' +
    '\n' + ':sp nombreArchivo: Abrir mas de dos archivos a la vez en la pantalla.' +
    '\n' + ':vsp nombreArchivo: Abrir mas de dos archivos pero con la separación vertical.' +
    '\n' + '# ' +
    '\n' + 'v: Modo de selección de texto.' +
    '\n' + 'SHFT + v: Seleccionar lineas completas.' +
    '\n' + 'CTRL + v: Seleccionar un bloque de lineas.' +
    '\n' + '# ' +
    '\n' + '<>: Tab hacia la izquierda o derecha.' +
    '\n' + 'CRTL + g: Ver información de la ubicación del cursor.' +
    '\n' + 'CTRL + w: Cambiar de un archivo a otro.' +
    '\n' + 'esc: Salir de cualquier modo.' +
    '\n' + '# ' +
    '\n' + '# Ver el editor de texto por defecto.' +
    '\n' + 'echo $EDITOR' +
    '\n' + '# ' +
    '\n' + '# Editor de texto que permite usar las flechas para moverse por los documentos.' +
    '\n' + 'nano' +
    '\n' + '# ' +
    '\n' + '# #Variables para el editor predeterminado al final del archivo .bashrc';

/*#instalar phpmyadmin*/
example_txt[5] = '# Instalar phpmyadmin' + '\n' + 'sudo apt install phpmyadmin php-mbstring php-zip php-gd php-json php-curl' + '\n' + '# ' + '\n' + '# modificar la seguridad de phpmyadmin' + '\n' + 'sudo vi /etc/apache2/conf-available/phpmyadmin.conf' + '\n' + '# ' + '\n' + '# Agregar "AllowOverride All" en el <Directory /usr/share/phpmyadmin>' + '\n' + '<Directory /usr/share/phpmyadmin>' + '\n' + '    Options FollowSymLinks' + '\n' + '    DirectoryIndex index.php' + '\n' + '    AllowOverride All' + '\n' + '# ' + '\n' + '# Reiniciar el servicio' + '\n' + 'sudo systemctl restart apache2' + '\n' + '# ' + '\n' + '# Crear el archivo de configuración de inicio' + '\n' + 'sudo vi /usr/share/phpmyadmin/.htaccess' + '\n' + '# ' + '\n' + '# Agregar estas lineas' + '\n' + 'AuthType Basic  -> Tipo de autenticación' + '\n' + 'AuthName "Restricted Files"' + '\n' + 'AuthUserFile /etc/phpmyadmin/.htpasswd' + '\n' + 'Require valid-user' + '\n' + '# ' + '\n' + '# Crear el archivo de contraseña' + '\n' + 'sudo htpasswd -c /etc/phpmyadmin/.htpasswd [username]' + '\n' + '# ' + '\n' + '# Agregar usuarios adicionales' + '\n' + 'sudo htpasswd /etc/phpmyadmin/.htpasswd [additionaluser]';

example_txt[6] = 'gzip nombreArchivo: Comprime un archivo en formato .gz sustituyendo el archivo original.' + '\n' + 'gzip nombreArchivo > /Ruta_especifica: Comprime un archivo en una ubicación específica.' + '\n' + '   -c: Conserva el archivo original.' + '\n' + '   -r: Compresión recursiva (Solo archivos individuales)' + '\n' + '   -v: Muestra la taza de compresión en la salida.' + '\n' + '   -rl: Permite consultar la taza de compresión de un archivo.' + '\n' + '# ' + '\n' + 'gunzip -l archivo.gz: Permite ver la taza de compresión de un archivo.' + '\n' + '# ' + '\n' + 'zcat: Permite ver el contenido de un archivo comprimido.' + '\n' + '   -f: Permite ver el contenido de un archivo no comprimido.' + '\n' + '# ' + '\n' + 'gunzip | bunzip2 [nombreArchivo/Carpeta] = gzip -d [nombreArchivo/Carpeta]: Descomprime un archivo.' + '\n' + '# ' + '\n' + 'bzip2 [nombreArchivo/carpeta]: Comprime archivos o carpetas (.bz2)' + '\n' + '   -l: Muestra el radio de compresión.' + '\n' + '   -v: Ver la compresión en la terminal.' + '\n' + '   -d: Aplica la descompresión.' + '\n' + '# ' + '\n' + 'bzcat: Ver el contenido de un archivo comprimido .bz2' + '\n' + '# ' + '\n' + 'xz [nombreArchivo/Carpeta]: Crea un archivo comprimido .xz' + '\n' + '# ' + '\n' + 'unxz [nombreArchivo/Carpeta]: Descomprimir un archivo' + '\n' + '# ' + '\n' + 'tar -cf  NombreArchivo/Carpeta.tar [NombreArchivo/Carpeta]' + '\n' + '   -c: Crear un archivo' + '\n' + '   -v: Mostrar lo que está haciendo.' + '\n' + '   -f NombreArchivo/Carpeta.tar: Especificar el nombre del archivo tar.' + '\n' + '   -t: Mostrar el contenido del archivo tar.' + '\n' + '   -z: Crear un archivo tar comprimido (.gz).' + '\n' + '   -j: Crear un archivo tar comprimido (.bz2).' + '\n' + '   -x: Extraer los datos de un archivo' + '\n' + '   -r: Añadir un archivo/carpeta a un archivo existente.' + '\n' + '   -C Carpeta_Destino: Permite elegir la carpeta donde se extraen los archivos.' + '\n' + '# ' + '\n' + 'zip [nombreArchivo].zip [nombreCarpeta]/*: Comprime los archivos de una carpeta.' + '\n' + '   -r: Indica que se debe usar recursividad.' + '\n' + '# ' + '\n' + 'unzip -l [nombreArchivo].zip: Lista los archivos dentro de un zip.' + '\n' + '# ' + '\n' + 'unzip [nombreArchivo].zip: Extrae los archivos comprimidos.';

example_txt[7] = '# Ver id de usuario y grupos a los que pertenece el usuario activo.' + '\n' + 'id' + '\n' + '# ' + '\n' + '# Grupos a los que pertenece el usuario activo o un usuario específico.' + '\n' + 'groups' + '\n' + '# ' + '\n' + '# Ver los grupos que tiene el sistema.' + '\n' + 'cat etc/group' + '\n' + '# ' + '\n' + '# Permite cambiar de usuario.' + '\n' + 'su [opciones] [usuario]' + '\n' + '	- | -l | --login: Cargar todo el entorno del usuario' + '\n' + '# ' + '\n' + '# Cambiar el dueño de un archivo o carpeta.' + '\n' + 'chown [usuario]:[grupo] [opciones] [nombreArchivo/Carpeta]' + '\n' + '	-R: Cambia los permisos de manera recursiva.' + '\n' + '# ' + '\n' + '# Cambiar el grupo dueño de un archivo' + '\n' + 'chgrp [grupo] [nombreArchivo/Carpeta]' + '\n' + '# ' + '\n' + '# Ver las propiedades de los archivos listados' + '\n' + 'ls -l' + '\n' + '# ' + '\n' + '[-][rwx][r-x][r-x] [USUARIO] [GRUPO] [FECHA] [NOMBRE_ ARCHIVO]' + '\n' + '	Primer campo: tipo de archivo' + '\n' + '	Segundo campo: Permisos de usuario (u)' + '\n' + '	Tercer campo: Permisos de grupo (g)' + '\n' + '	Cuarto espacio: Otros (o)' + '\n' + 'lectura: r = 4' + '\n' + 'Escritura: w = 2' + '\n' + 'Ejecución: x = 1' + '\n' + 'Total: rwx = 7' + '\n' + '# ' + '\n' + 'Group Symbol		Operation Symbol			        Permission Symbol   	    Value' + '\n' + 'u (user owner)		+ (add the permission)			        r (read)                  4' + '\n' + 'g (group owner)		= (specify the exact permission)	w (write)                 2' + '\n' + 'o (others)			- (remove the permission)		        x (execute)               1' + '\n' + 'a (all)									                s (setgid)' + '\n' + '									                        t (sticky bit)' + '\n' + '# ' + '\n' + '# Cambiar permisos a un archivo o directorio.' + '\n' + 'chmod MODE FILE...' + '\n' + '# ' + '\n' + '# Quitar los permisos de lectura para otros usuarios.' + '\n' + 'chmod o-r FILE...' + '\n' + '# ' + '\n' + '# Agregar permisos de lectura y escritura a otros usuarios.' + '\n' + 'chmod o+rw FILE...' + '\n' + '# ' + '\n' + '# Asignar permisos de setgid para el grupo a una carpeta.' + '\n' + 'chmod g+s [DIRECTORY...]' + '\n' + '# ' + '\n' + '# Asignar propiedad de sticky bit a otros usuarios.' + '\n' + 'chmod o+t [DIRECTORY...]' + '\n' + '# ' + '\n' + '# Cambiar los permisos a un directorio.' + '\n' + 'chmod [[#u][#g][#o]] = [###] DIRECTORY...' + '\n' + '# ' + '\n' + '# Solo los miembros del grupo y el usuario dueño pueden ver el archivo.' + '\n' + 'chmod 770 DIRECTORY...';

example_txt[8] = '# Terminal CLI (Command Line Interface)'
    + '\n' + '# '
    + '\n' + '#  - crtl + r: Buscar comandos anteriores'
    + '\n' + '#  - ctrl + a: Inicio de linea.'
    + '\n' + '#  - ctrl + e: Final de la linea.'
    + '\n' + '# '
    + '\n' + '# Cambiar de usuario en la linea de comandos.'
    + '\n' + 'sudo su'
    + '\n' + '# '
    + '\n' + '# Despliega información del sistema.'
    + '\n' + 'uname -a'
    + '\n' + '#       -s: Muestra el kernel.'
    + '\n' + '#       -p: Muestra el tipo de procesador.'
    + '\n' + '#       -i: Muestra la plataforma del hardware.'
    + '\n' + '#       -m: Muestra la arquitectura.'
    + '\n' + '#       -r: Muestra la versión del kernel.'
    + '\n' + '# '
    + '\n' + '# Muestra el tipo de comando.'
    + '\n' + 'type [comando]'
    + '\n' + '# '
    + '\n' + '# Muestra la ubicación del ejecutable del comando.'
    + '\n' + '#  which [comando]'
    + '\n' + '# '
    + '\n' + '# Historial de comandos'
    + '\n' + 'history'
    + '\n' + '# '
    + '\n' + '# Muestra los últimos cinco comandos de la lista del historial'
    + '\n' + 'history 5'
    + '\n' + '# '
    + '\n' + '# Ejecuta el último comando otra vez'
    + '\n' + '!!'
    + '\n' + '# '
    + '\n' + '# Ejecuta el quinto comando desde la parte inferior de la lista de historial'
    + '\n' + '!-5'
    + '\n' + '# '
    + '\n' + '# Ejecuta el comando ls más reciente'
    + '\n' + '!ls'
    + '\n' + '# '
    + '\n' + '# Limpiar el historial.'
    + '\n' + 'history -c';

example_txt[9] = '# Moverse hacia la carpeta /let/www/html' + '\n' +
    'cd /let/www/html' + '\n' +
    '# Descargar nextcloud a esta ubicación y descomprimir' + '\n' +
    'sudo wget -c https://download.nextcloud.com/server/releases/nextcloud-21.0.1.zip' + '\n' +
    '# Listamos el contenido de la carpeta para ver el archivo descargado' + '\n' +
    '# ' + '\n' +
    'ls -l' + '\n' +
    '# ' + '\n' +
    'sudo unzip nextcloud-21.0.1.zip' + '\n' +
    '# ' + '\n' +
    '# ' + '\n' +
    '# Otorgar permisos a las carpetas' + '\n' +
    'sudo chown -R www-data:www-data /let/www/html' + '\n' +
    'sudo chmod -R 775 /let/www/html' + '\n';


example_txt[10] = '# Utilizaremos el comando iptables para crear un firewall básico de seguridad.' + '\n' +
    '# ' + '\n' +
    '# Lo primero que haremos antes de instalar es verificar que el sistema está' + '\n' +
    '# actualizado' + '\n' +
    'sudo apt update' + '\n' +
    '# Si ahy actualizaciones pendientes las revisamos y las instalamos' + '\n' +
    'sudo apt upgrade' + '\n' +
    '# ' + '\n' +
    '# Nótese que apt update compara las versiones de los programas instalados en' + '\n' +
    '# nuestro server con respecto al las disponibles en los repositorios' + '\n' +
    '# configurados en el archivo /etc/apt/sources.list o en los archivos dentro de' + '\n' +
    '# la carpeta /etc/apt/sources.list.d/' + '\n' +
    '# ' + '\n' +
    '# Instalamos nmap que es una herramienta de monitores de puertos de red y mucho mas' + '\n' +
    'sudo apt install nmap' + '\n' +
    '# Se instala chkrootkit y rkhunter para monitorear el server de posibles rootkits' + '\n' +
    'sudo apt install rkhunter chkrootkit' + '\n' +
    '# Instalamos iptables' + '\n' +
    'sudo apt install iptables' + '\n' +
    '# Listamos las reglas instaladas por defecto ' + '\n' +
    'sudo iptables -L -n -v' + '\n' +
    '# ' + '\n' +
    '# Nos aseguramos de estar en $HOME ejecutando cd sin argumentos' + '\n' +
    'cd' + '\n' +
    '# ' + '\n' +
    '# Descargamos el script con los comandos para implementar el firewall ' + '\n' +
    'wget -c https://linux.jcampos.me/public/files/firewall-iptables.sh' + '\n' +
    '# ' + '\n' +
    '# Lo ejecutamos como superusuario' + '\n' +
    'sudo bash firewall-iptables.sh' + '\n' +
    '# ' + '\n' +
    '# Instalamos iptables-persistent para guardar las reglas actuales' + '\n' +
    'sudo apt install iptables-persistent' + '\n' +
    '# ' + '\n' +
    '# Nos preguntará si guardamos las reglas actuales a los archivos ' + '\n' +
    '# /etc/iptables/rules.v4 y /etc/iptables/rules.v6, le decimos que si' + '\n' +
    '# ' + '\n' +
    '# Ejecutamos el siguiente comando para que las reglas sean permanentes' + '\n' +
    'sudo netfilter-persistent save' + '\n' +
    '# ' + '\n';

example_txt[11] = '# Nos aseguramos de que el usuario root no se pueda conectar remotamente, esto con el' + '\n' +
    '# objetivo de eliminar superficies de ataque ya que el usuario root existe en' + '\n' +
    '# todos los linux y es común que sea sujeto de ataques de fuerza bruta' + '\n' +
    '# ' + '\n' +
    'sudo vi /etc/ssh/sshd_config' + '\n' +
    '# Modificamos la directiva deseada' + '\n' +
    'PermitRootLogin no' + '\n' +
    '# ' + '\n' +
    '# guardamos y cerramos el archivo con :wq! y reiniciamos el servicio de ssh' + '\n' +
    'sudo systemctl restart ssh' + '\n' +
    '# ' + '\n' +
    '# Si perdemos la conexión simplemente volvemos a iniciar sesión como se hizo' + '\n' +
    '# anteriormente' + '\n';

example_txt[12] = '# Instalamos fail2ban para agregar una capa extra de protección contra ataques' + '\n' +
    '# de fuerza bruta y DOS -  DDOS.' + '\n' +
    'sudo apt install fail2ban' + '\n' +
    'sudo cp -a /etc/fail2ban/jail.conf /etc/fail2ban/jail.local' + '\n' +
    '# En /etc/fail2ban/jail.local realizamos nuestras personalizaciones si queremos' + '\n' +
    '# En nuestro casi dejaremos las personalizaciones por defecto. Si se hace algún cambio ' + '\n' +
    '# en el archivo jail.conf se debe reiniciar el servicio. ' + '\n' +
    '# ' + '\n' +
    '# Reiniciamos el servicio de fail2ban' + '\n' +
    'sudo systemctl restart fail2ban' + '\n' +
    '# ' + '\n' +
    '# fail2ban se puede configurar no solo para proteger accesos a través de ssh pero' + '\n' +
    '# si se desea saber más, puede leer el manual del comando.' + '\n' +
    'man fail2ban' + '\n';

example_txt[13] = '# Administración de paquetes.' +
    '\n' + 'apt-get' +
    '\n \n' + '# Obtener una lista actualizada de estos repositorios de Internet.' +
    '\n' + 'sudo apt-get update' +
    '\n \n' + '# Buscar palabras clave dentro de los repositorios.' +
    '\n' + 'sudo apt-cache search [keyword]' +
    '\n \n' + '# Instalar un paquete.' +
    '\n' + 'sudo apt-get install [package]' +
    '\n \n' + '# Actualizar todos los paquetes posibles.' +
    '\n' + 'sudo apt-get upgrade' +
    '\n \n' + '# Eliminar todos los archivos de un paquete de software.' +
    '\n' + 'sudo apt-get remove [package]' +
    '\n' + '   --purge: Elimina los archivos de configuración de un paquete de software.';


example_txt[14] = '# Dirige por defecto al directorio home del usuario' + '\n' +
    'cd' + '\n' +
    '# ' + '\n' +
    '# Vuelve a la carpeta anterior.' + '\n' +
    'cd ..' + '\n' +
    '# ' + '\n' +
    '# navegar a una ruta especifica.' + '\n' +
    'cd /ruta' + '\n' +
    '# ' + '\n' +
    '# Lista los archivos y carpetas del directorio actual' + '\n' +
    'ls' + '\n' +
    '# ' + '\n' +
    '# Lista el contenido de carpeta en lugar del actual' + '\n' +
    'ls /carpeta' + '\n' +
    '        -a: Permite ver los archivos ocultos.' + '\n' +
    '        -l: Incluye datos de quién es el dueño de un archivo, el tamaño y la última vez que se modificó el contenido.' + '\n' +
    '        -lh: Muestra el tamaño del archivo en megabytes o gigabytes' + '\n' +
    '        -ld /carpeta: lista el directorio /carpeta sin los archivos que tiene dentro.' + '\n' +
    '        -R: Listado recursivo' + '\n' +
    '        -S: Ordenar los archivos por tamaño.' + '\n' +
    '        -t: Ordena los archivos por fecha de modificación.' + '\n' +
    '        -t --full time: Muestra la fecha y hora completas.' + '\n' +
    '        -r: Lista los archivos de los menos a los mas pesados.' + '\n' +
    '        -d: el comando no muestra el contenido de un directorio, sino más bien el nombre del directorio.' + '\n' +
    '        -l /etc/ppp | tail -5 | nl: tail -5: Capta las ultimas 5 lineas del comando ls, y nl las enumera del 1 al 5.' + '\n' +
    '        -r: Ordenar los archivos de menor a mayor.' + '\n' +
    '# ' + '\n' +
    '# Muestra el tipo de archivo.' + '\n' +
    'file [archivo]' + '\n' +
    '# ' + '\n' +
    '# Copia un archivo de un directorio a otro.' + '\n' +
    'cp [fuente] [destino]' + '\n' +
    '        -v: Muestra un mensaje si el archivo se copia correctamente.' + '\n' +
    '        -i: Pregunta antes de sobrescribir un archivo.' + '\n' +
    '        -r: Copia los archivos y los directorios.' + '\n' +
    '        -ra: Mantiene los atributos de los archivos.' + '\n' +
    '# ' + '\n' +
    '# Mueve un archivo de un directorio a otro.' + '\n' +
    'mv [fuente] [destino]' + '\n' +
    '        -i: Movimiento interactivo: pregunta si un archivo debe sobrescribirse.' + '\n' +
    '        -n: No sobrescribir el contenido de los archivos de destino.' + '\n' +
    '        -v: Verbose: muestra el movimiento resultante.' + '\n' +
    '# ' + '\n' +
    '# Renombra un archivo.' + '\n' +
    'mv [nombreArchivo] [nuevoNombre]' + '\n' +
    '# ' + '\n' +
    '# Crea un archivo vacío.' + '\n' +
    'touch [nombreArchivo]' + '\n' +
    '# ' + '\n' +
    '# Elimina un archivo.' + '\n' +
    'rm [nombreArchivo]' + '\n' +
    '        -i: Pregunta antes de eliminar un archivo.' + '\n' +
    '        -r [nombreDirectorio]: Elimina un directorio.' + '\n' +
    '        -rf: Elimina una carpeta con contenido.' + '\n' +
    '        -p: Remover un directorio con otro dentro.' + '\n' +
    '# ' + '\n' +
    '# Crea un directorio.' + '\n' +
    'mkdir [nombreDirectorio]' + '\n' +
    '        -p: Crea una carpeta dentro de otra que no existe.' + '\n' +
    '        -m: Crea una carpeta con permisos de solo lectura.' + '\n' +
    '        -v: Muestra el nombre del directorio que se crea.' + '\n' +
    '# ' + '\n' +
    '# Elimina un directorio si esta vacío.' + '\n' +
    'rmdir [nombreDirectorio]' + '\n' +
    '        -i: Pregunta antes de eliminar un directorio.' + '\n' +
    '        -p: Elimina un directorio con otro dentro.' + '\n' +
    '        -v: Muestra el nombre del directorio que se elimina.' + '\n' +
    '# ' + '\n' +
    '# Crear un directorio.' + '\n' +
    'mkdir [nombreDirectorio]' + '\n' +
    '        -p: Crea una carpeta dentro de otra que no existe.' + '\n' +
    '        -m: Crea una carpeta con permisos de solo lectura.' + '\n' +
    '        -v: Muestra el nombre del directorio que se crea.' + '\n' +
    '# ' + '\n' +
    '# Ver archivos en el directorio etc que empiecen con la letra t.' + '\n' +
    'echo /etc/t*' + '\n' +
    '# ' + '\n' +
    '# Buscar archivos con extensiones de tres letras' + '\n' +
    'echo /etc/*.???' + '\n' +
    '# ' + '\n' +
    '# Mostrar todos los archivos que comiencen con cualquier letra entre a y d.' + '\n' +
    'echo /etc/[a-d]*' + '\n' +
    '# ' + '\n' +
    '# ' + '\n' +
    '# Enviar mensaje por consola' + '\n' +
    'echo The service costs \$100 and the path is $PATH' + '\n' +
    '        The service costs $100 and the path is /usr/bin/custom:/home/sysadmin/bin:...' + '\n' +
    '# ' + '\n' +
    '# Todos los archivos' + '\n' +
    'echo *' + '\n' +
    '# ' + '\n' +
    '# Todos los archivos que tienen tres caracteres' + '\n' +
    'echo ???' + '\n' +
    '# ' + '\n' +
    '# Archivos que empiezan con P, T O M' + '\n' +
    'echo [PTM]' + '\n' +
    '# ' + '\n' +
    '# [!, ^]: Para negar' + '\n' +
    '# Mostrar cualquier archivo que no comienza con D o P.' + '\n' +
    'echo /etc/[^DP]*' + '\n';

example_txt[15] = '# Conectarse al servidor SSH con un usuario específico' +
    '\n' + '# ' +
    '\n' + 'ssh [user]@[IP]' +
    '\n' + '#' +
    '\n' + '#' +
    '\n' + '# alternativamente ' +
    '\n' + '#' +
    '\n' + 'ssh -l [user] [IP]';

example_txt[16] = '# Moverse hacia la carpeta /var/www/html' +
    '\n' + 'cd /var/www/html' +
    '\n' + '# Descargar nextcloud a esta ubicación y descomprimir' +
    '\n' + 'sudo scp [user]@[host]:nombre_archivo.zip' +
    '\n' + '#' +
    '\n' + '# O mediante wget' +
    '\n' + 'sudo wget -c https://download.nextcloud.com/server/releases/nextcloud-21.0.1.zip' +
    '\n' + '#' +
    '\n' + '# Listamos el contenido de la carpeta para ver el archivo descargado' +
    '\n' + '#' +
    '\n' + 'ls -l' +
    '\n' + '#' +
    '\n' + 'sudo unzip nombre_archivo.zip' +
    '\n' + '#' +
    '\n' + 'sudo unzip nextcloud-21.0.1.zip' +
    '\n' + '#' +
    '\n' + '# Otorgar permisos a las carpetas' +
    '\n' + 'sudo chown -R www-data:www-data /var/www/html; sudo chmod -R 775 /var/www/html';

example_txt[17] = '# Lo primero que hacemos es crear el virtual host para nuestro server usando como' +
'\n' + '# plantilla el virtualhost por defecto para http' +
'\n' + '# Primero accedemos a /etc/apache2/apache2.conf' +
'\n' + 'sudo vim /etc/apache2/apache2.conf' +
'\n' + '# y cambiamos' +
'\n' + '#' +
'\n' + '#' +
'\n' + '#' +
'\n' + '<Directory /var/www/>' +
'\n' + '        Options FollowSymLinks Indexes' +
'\n' + '        AllowOverride None' +
'\n' + '        Require all granted' +
'\n' + '</Directory>' +
'\n' + '# ' +
'\n' + '# a ' +
'\n' + '#' +
'\n' + '<Directory /var/www/>' +
'\n' + '        Options FollowSymLinks' +
'\n' + '        AllowOverride None' +
'\n' + '        Require all granted' +
'\n' + '</Directory>' +
'\n' + '#' +
'\n' + '# Nótese que lo único que hacemos es remover la directiva Indexes a la carpeta /var/www/' +
'\n' + '#' +
'\n' + '# Luego copiamos el virtualhost que viene por defecto para realizar nuestras personalizaciones' +
'\n' + '#' +
'\n' + 'sudo cp -a /etc/apache2/sites-available/000-default.conf /etc/apache2/sites-available/nextcloud.conf' +
'\n' + '#' +
'\n' + '# Se procede a cambiar la directiva DocumentRoot a /var/www/html/nextcloud en /etc/apache2/sites-available/nextcloud.conf' +
'\n' + 'sudo vi /etc/apache2/sites-available/nextcloud.conf' +
'\n' + '# Debemos cambiar la directiva DocumentRoot y agregar las directiva <Directory > </Directory> para que queden de la siguiente manera:' +
'\n' + '#' +
'\n' + '	DocumentRoot /var/www/html/nextcloud' +
'\n' + '	ErrorLog ${APACHE_LOG_DIR}/nextcloud.error' +
'\n' + '	CustomLog ${APACHE_LOG_DIR}/nextcloud.access combined' +
'\n' +
'\n' + '        <Directory /var/www/html/nextcloud/>' +
'\n' + '		Require all granted' +
'\n' + '		Options FollowSymlinks MultiViews' +
'\n' + '		AllowOverride All' +
'\n' +
'\n' + '		<IfModule mod_dav.c>' +
'\n' + '			Dav off' +
'\n' + '		</IfModule>' +
'\n' +
'\n' + '		SetEnv HOME /var/www/html/nextcloud' +
'\n' + '		SetEnv HTTP_HOME /var/www/html/nextcloud' +
'\n' + '		Satisfy Any' +
'\n' + '	</Directory>' +
'\n' + '# Guardar archivo con las teclas Escape mas  :wq!' +
'\n' + '#' +
'\n' + '#' +
'\n' + '# Deshabilitamos el sitio activado por defecto' +
'\n' + 'sudo a2dissite 000-default.conf' +
'\n' + 'sudo rm /var/www/html/index.html' +
'\n' + '#' +
'\n' + '# Activamos nuestro sitio y activamos los modulos requeridos' +
'\n' + 'sudo a2ensite nextcloud.conf' +
'\n' + 'a2enmod rewrite headers env dir mime setenvif ssl' +
'\n' + '# Reiniciamos el servicio de apache' +
'\n' + 'sudo systemctl restart apache2' +
'\n' + '#' +
'\n' + '# Ahora procedemos a realizar la configuración de nextcloud, necesitaremos la base de datos con el usuario autorizado a usarla y la contraseña y deberemos' +
'\n' + '# configurar un usuario administrativo para nextcloud, para esto volvemos a acceder a nuestro server a travez del navegador:' +
'\n' + '# http://IP-SERVER-REMOTO' +
'\n' + '#';

example_txt[18] = '# Configuración de HTTPS' +
'\n' + 'sudo apt install openssl; sudo a2enmod ssl; systemctl restart apache2' +
'\n' + '# Configuración de apache para permitir la reescritura de direcciones' +
'\n' + 'sudo vi /etc/apache2/apache2.conf' +
'\n' + '#' +
'\n' + '# Agregar las siguientes lineas al final del archivo' +
'\n' + '#' +
'\n' + '<Directory /var/www/html>' +
'\n' + '	AllowOverride All' +
'\n' + '</Directory>' +
'\n' + '#' +
'\n' + '# Instalar el core de snap' +
'\n' + 'sudo snap install core; sudo snap refresh core' +
'\n' + '#' +
'\n' + '# Instalar certbot' +
'\n' + 'sudo snap install --classic certbot' +
'\n' + '#' +
'\n' + '# Agregar certbot a la linea de comandos' +
'\n' + 'sudo ln -s /snap/bin/certbot /usr/bin/certbot' +
'\n' + '#' +
'\n' + '# Instalar certificado' +
'\n' + 'sudo certbot --apache' +
'\n' + '#' +
'\n' + '# Es posible renovar el certificado, pero este proceso se realiza automáticamente' +
'\n' + 'sudo certbot renew --dry-run' +
'\n' + '#' +
'\n' + '# Ya se ha configurado el servidor en https';

/** Mostrar la información del collapse de seguridad */
function mostrar_seguridad() {
    if (elemento != 'seguridad') {
        // Mostrar el collapse de seguridad
        $('#seguridad').collapse('show');

        elemento = 'seguridad';
    } else { // Ocultar el collapse de seguridad
        $('#seguridad').collapse('hide');

        elemento = '';
    }
}

/** Mostrar el ejemplo de la instalación de paquetes */
function ejemplo(nombre_ejemplo = '', taller = false) {
    if (ejemplo_activo == nombre_ejemplo) {
        ejemplo_activo = '';
        texto_copiar = '';

        //Icono de ejemplos

    } else {
        let icono = "fa-solid fa-pen-to-square";
        let title = "Ejemplo";

        // Limpiar el elemento
        $('.terminal').empty();

        switch (nombre_ejemplo) {
            case 'apache':
                texto_copiar = example_txt[0];

                icono = "fa-brands fa-html5";
                title = "Servidor Apache";

                break;

            case 'php':
                texto_copiar = example_txt[1];

                icono = "fa-brands fa-php";
                title = "PHP";

                break;

            case 'crear_usuario':
                texto_copiar = example_txt[2];

                icono = "fa-solid fa-user-plus";
                title = "Crear usuario";

                break;

            case 'mysql':
                texto_copiar = example_txt[3];

                icono = "fa-brands fa-mysql";
                title = "Servidor MySQL";

                break;

            case 'vi':
                texto_copiar = example_txt[4];

                icono = "fa-solid fa-file-code";
                title = "Editor de texto VI";

                break;

            case 'phpmyadmin':
                texto_copiar = example_txt[5];

                icono = "fa-brands fa-php";
                title = "Administrador de MySQL";

                break;

            case 'paquetes':
                texto_copiar = example_txt[13];

                icono = "fa-solid fa-box";
                title = "Gestión de paquetes";

                break;

            case 'compresion':
                texto_copiar = example_txt[6];

                icono = "fa-solid fa-file-archive";
                title = "Compresión de archivos";

                break;

            case 'permisos':
                texto_copiar = example_txt[7];

                icono = "fa-solid fa-user-lock";
                title = "Manejo de permisos";

                break;

            case 'cli':
                texto_copiar = example_txt[8];

                icono = "fa-solid fa-terminal";
                title = "Linea de comandos CLI";

                break;

            case 'obtener':
                texto_copiar = example_txt[9];

                icono = "fa-solid fa-download";
                title = "Descargar página de ejemplo";

                break;

            case 'firewall':
                texto_copiar = example_txt[10];

                icono = "fa-solid fa-shield-alt";
                title = "Firewall";

                break;

            case 'ingreso':
                texto_copiar = example_txt[11];

                icono = "fa-solid fa-sign-in-alt";
                title = "Ingreso remoto";

                break;

            case 'fuerza':
                texto_copiar = example_txt[12];

                icono = "fa-solid fa-user-secret";
                title = "Ataques de fuerza bruta";

                break;

            case 'gestion_archivos':
                texto_copiar = example_txt[14];

                icono = "fa-solid fa-file";
                title = "Gestión de archivos";

                break;

            case 'ssh':
                texto_copiar = example_txt[15];

                icono = "fa-solid fa-server";
                title = "Ingreso remoto SSH";

                break;

            case 'descargar':
                texto_copiar = example_txt[16];

                icono = "fa-solid fa-download";
                title = "Descargar archivos";

                break;

            case 'configurar':
                texto_copiar = example_txt[17];

                icono = "fa-solid fa-cog";
                title = "Configurar aplicación web";

                break;

            case 'ssl':
                texto_copiar = example_txt[18];

                icono = "fa-solid fa-lock";
                title = "SSL";

                break;
        }

        if (texto_copiar != null && texto_copiar != '') {
            if(taller){
                console.log('Taller');

                CodeMirror(document.querySelector('#terminal_' + nombre_ejemplo), {
                    lineNumbers: true,
                    value: texto_copiar,
                    mode: 'shell',
                    theme: 'monokai',
                    readOnly: true,
                    autoRefresh: true,
                    viewportMargin: Infinity,
                });
            } else {
                CodeMirror(document.querySelector('#terminal_ejemplos'), {
                    lineNumbers: true,
                    value: texto_copiar,
                    mode: 'shell',
                    theme: 'monokai',
                    readOnly: true,
                    autoRefresh: true,
                    viewportMargin: Infinity,
                });

                icono = '<i class="fa-xs ' + icono + '"></i>';

                //Colocar el título al modal
                $('#title_terminal').html(icono + ' ' + title);

                //Mostrar el modal_terminal
                $('#modal_terminal').modal('show');
            }

            ejemplo_activo = nombre_ejemplo;
        }
    } // Fin else
}// Fin de la función

/**
 * Copiar el texto al portapapeles
 */
function copiar_texto() {
    copiar(texto_copiar).then(r => {
        notification('Ejemplo copiado', '', 'success');
    });
}

/**
 * Descargar un archivo
 */
function descargar_archivo() {
    let file = "https://linux.jcampos.me/files/firewall.sh";
    window.open(file, '_blank');
}


/** Mostrar una notificación al usuario
 *
 * @param {string} titulo Titulo de la notificación
 * @param {string} mensaje Mensaje de la notificación
 * @param {string} icono Icono de la notificación
 *
 * */
function notification(titulo, mensaje, icono) {
    Toast.fire({icon: icono, title: titulo, text: mensaje})
}

/**
 * Mostrar el modal de introducción
 */
function show_intro() {
    $('#info_linux').modal('show');
}
