
var elemento = null;
var ejemplo_activo = null;
var texto_copiar = null;

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


let txt_ejemplo_instalacion = [];

txt_ejemplo_instalacion[0] = '#LAMP' + '\n' +
    '#Un servidor  "LAMP" es un conjunto de un sistema operativo mas software' + '\n' +
    '#adicional de código abierto, que permiten a dicho servidor alojar' + '\n' +
    '#sitios web dinámicos y/o aplicaciones web.' + '\n' +
    '#LAMP es un acrónimo que representa el sistema operativo GNU/Linux, el servidor' + '\n' +
    '#web Apache, con los datos del sitio almacenados en una base de datos' + '\n' +
    '#MySQL/MariaDB y PHP que procesa el contenido dinámico.(Javascript, llamada a' + '\n' +
    '#bases de datos, etc)' + '\n' +
    '#\n' +
    '#\n' +
    '#\n' +
    '#Instalación de webserver' + '\n' +
    'sudo apt install apache2' + '\n' +
    'sudo a2enmod rewrite' + '\n' +
    'sudo systemctl restart apache2' + '\n' +
    '#Accedemos en un browser ' + '\n' +
    'http://ip_server_remoto (Se puede usar comando "ip a" para ver su IP si la olvido)';

txt_ejemplo_instalacion[1] = '#Instalación de servidor de base de datos' + '\n' +
    'sudo apt install mariadb-server' + '\n' + '#\n' + '#Agregar el repositorio de php' + '\n' +
    'sudo add-apt-repository ppa:ondrej/php' + '\n' + '#\n' +
    '#Instalamos php y las dependencias recomendadas para que php pueda' + '\n' +
    '#interactuar con el webserver y la base de datos ' + '\n' +
    'sudo apt install php8.1' + '\n' + 'sudo apt install php8.1-fpm libapache2-mod-fcgid' + '\n' +
    'sudo apt install -y php8.1-mysql php8.1-dom php8.1-simplexml php8.1-ssh2 php8.1-xml php8.1-xmlreader php8.1-curl php8.1-ftp php8.1-gd  php8.1-iconv php8.1-imagick php8.1-mbstring php8.1-posix php8.1-sockets php8.1-tokenizer' + '\n' +
    'sudo apt install -y php8.1-mysqli php8.1-pdo  php8.1-sqlite3 php8.1-ctype php8.1-fileinfo php8.1-zip php8.1-exif' + '\n' +
    'sudo apt install php8.1-{cli,fpm,common,intl,tidy,soap,bcmath,xmlrpc}';

txt_ejemplo_instalacion[2] = '#Procedemos a crear un usuario con privilegios que no sea root' + '\n' +
    'adduser sysadmin' + '\n' + 'usermod -a -G sudo sysadmin' + '\n' + '#\n' +
    '#Procedemos a cerrar sesion en el server remoto con el usuario root y nos' + '\n' +
    '#conectamos con el usuario ubuntu_sysadmin recien creado' + '\n' +
    'ssh sysadmin@[direccion_IP]' + '\n' + '#\n' + '#alternativamente ' + '\n' +
    'ssh -l ubuntu_sysadmin IP-SERVER-REMOTO';

txt_ejemplo_instalacion[3] = '#Si no se ha corrido todavía, Lo primero que debemos hacer es correr el' +
    '\n' + '#siguiente comando en la terminal:' + '\n' +
    'sudo mysql_secure_installation' + '\n' + '#' + '\n' +
    '#Si todavía no se ha configurado el password del usuario root de mysql' + '\n' +
    '#se procede a configurarlo  y se da si a todas las demas opciones solicitadas.' + '\n' +
    '#' + '\n' +
    '#Una vez completado el comando anterior se procede a ingresar a la consola de mysql,' + '\n' +
    '#la opcion -u indica el usuario y -p para' + '\n' +
    '#solicitar el password interactivamente.' + '\n' +
    'sudo mysql -u root -p' + '\n' +
    '#Usamos el password de ubuntu_sysadmin o el que acabamos de crear para la base de datos' + '\n' +
    '#' + '\n' +
    '#Cambiar contraseña de un usuario' + '\n' +
    'ALTER USER \'user\'@\'localhost\' IDENTIFIED BY \'new_password\';' + '\n' +
    '#' + '\n' +
    '#agregar un nuevo usuario' + '\n' +
    'CREATE USER \'new_user\'@\'localhost\' IDENTIFIED BY \'password\';' + '\n' +
    '#' + '\n' +
    '#dar permisos al usuario' + '\n' +
    'GRANT ALL PRIVILEGES ON *.* TO \'new_user\'@\'localhost\' WITH GRANT OPTION;' + '\n' +
    '#' + '\n' +
    '#recargar privilegios' + '\n' +
    'FLUSH PRIVILEGES;' + '\n' +
    '#' + '\n' +
    '#salir' + '\n' +
    'exit;';

txt_ejemplo_instalacion[4] = '#Crear un nuevo archivo con VI.' + '\n' + 'vi [nombreArchivo]' + '\n' + '#' + '\n' + '#Tutorial de vim en español (Otros idiomas disponibles).' + '\n' + 'vimtutor es' + '\n' + '#' + '\n' + '#Atajos del teclado' + '\n' + 'i: Entrar al modo de edición en el cursor' + '\n' + 'I: Entrar al modo edición al inicio de la linea.' + '\n' + '#' + '\n' + 'a: Insertar justo despues del cursor.' + '\n' + 'A: Insertar al final de la linea' + '\n' + '#' + '\n' + 'O: Insertar una linea hacia arriba.' + '\n' + '#' + '\n' + 'j: Una linea hacia abajo.' + '\n' + 'k: Una linea hacia arriba.' + '\n' + 'o: Insertar una linea al final del documento.' + '\n' + '#' + '\n' + 'l: Caracter a la derecha.' + '\n' + 'h: Caracter a la izquierda.' + '\n' + 'w: Inicio de la palabra de adelante' + '\n' + 'b: Inicio de la palabra anterior.' + '\n' + '#' + '\n' + 'G: Ir a una linea específica.' + '\n' + 'gg: Ir al inicio del texto' + '\n' + 'GG: Ir al final del documento.' + '\n' + '#' + '\n' + 'y: Copiar.' + '\n' + 'yy: Copiar toda la linea' + '\n' + '3yy: Copiar tres lineas' + '\n' + 'yw: Copiar la palabra actual.' + '\n' + 'y3w: Copiar las siguientes tres palabras.' + '\n' + 'y^: Copiar del punto actual al inicio de la linea.' + '\n' + '#' + '\n' + 'cc: Change (replace) a line of the document.' + '\n' + 'p | P: Pegar (p pega con un espacio entre palabras | P pega sin espacio)' + '\n' + 'x: Borrar letra por letra.' + '\n' + '#' + '\n' + 'd: Cortar o borrar.' + '\n' + 'dd: Borrar toda la linea' + '\n' + '3dd: Borrar tres lineas' + '\n' + 'dw: Cortar la palabra actual.' + '\n' + 'd3w: Cortar las siguientes tres palabras.' + '\n' + 'd^: Cortar del punto actual al inicio de la linea.' + '\n' + '#' + '\n' + 'u: Deshacer el último cambio.' + '\n' + 'r + Letra: Reemplazar una letra específica.' + '\n' + '#' + '\n' + '/Palabra: Buscar en el documento' + '\n' + 'n:Ir al resultado siguiente.' + '\n' + 'N:' + '\n' + '#' + '\n' + '$: Ir al final de la linea.' + '\n' + '^: Ir al inicio de la linea.' + '\n' + '#' + '\n' + ':w = Guardar.' + '\n' + 'ZZ | :wq = Guardar y salir.' + '\n' + ':q = Salir sin hacer cambios al documento' + '\n' + ':q!: Salir sin guardar.' + '\n' + '#' + '\n' + ':set nu = Ver números de linea' + '\n' + ':colorscheme: Cambiar el color de vi.' + '\n' + '#' + '\n' + ':sp nombreArchivo: Abrir mas de dos archivos a la vez en la pantalla.' + '\n' + ':vsp nombreArchivo: Abrir mas de dos archivos pero con la separación vertical.' + '\n' + '#' + '\n' + 'v: Modo de selección de texto.' + '\n' + 'SHFT + v: Seleccionar lineas completas.' + '\n' + 'CTRL + v: Seleccionar un bloque de lineas.' + '\n' + '#' + '\n' + '<>: Tab hacia la izquierda o derecha.' + '\n' + 'CRTL + g: Ver informacion de la ubicación del cursor.' + '\n' + 'CTRL + w: Cambiar de un archivo a otro.' + '\n' + 'esc: Salir de cualquier modo.' + '\n' + '#' + '\n' + '#Ver el editor de texto por defecto.' + '\n' + 'echo $EDITOR' + '\n' + '#' + '\n' + '#Editor de texto que permite usar las flechas para moverse por los documentos.'
'nano' + '\n' + '#' + '\n' + '##Variables para el editor predeterminado al final del archivo .bashrc';

/*#instalar phpmyadmin*/
txt_ejemplo_instalacion[5] = '#Instalar phpmyadmin' + '\n' + 'sudo apt install phpmyadmin php-mbstring php-zip php-gd php-json php-curl' + '\n' + '#' + '\n' + '#modificar la seguridad de phpmyadmin' + '\n' + 'sudo vi /etc/apache2/conf-available/phpmyadmin.conf' + '\n' + '#' + '\n' + '#Agregar "AllowOverride All" en el <Directory /usr/share/phpmyadmin>' + '\n' + '<Directory /usr/share/phpmyadmin>' + '\n' + '    Options FollowSymLinks' + '\n' + '    DirectoryIndex index.php' + '\n' + '    AllowOverride All' + '\n' + '#' + '\n' + '#Reiniciar el servicio' + '\n' + 'sudo systemctl restart apache2' + '\n' + '#' + '\n' + '#Crear el archivo de configuracion de inicio' + '\n' + 'sudo vi /usr/share/phpmyadmin/.htaccess' + '\n' + '#' + '\n' + '#Agregar estas lineas' + '\n' + 'AuthType Basic  -> Tipo de autenticacion' + '\n' + 'AuthName "Restricted Files"' + '\n' + 'AuthUserFile /etc/phpmyadmin/.htpasswd' + '\n' + 'Require valid-user' + '\n' + '#' + '\n' + '#Crear el archivo de contrasenia' + '\n' + 'sudo htpasswd -c /etc/phpmyadmin/.htpasswd [username]' + '\n' + '#' + '\n' + '#Agregar usuarios adicionales' + '\n' + 'sudo htpasswd /etc/phpmyadmin/.htpasswd [additionaluser]';

txt_ejemplo_instalacion[6] = 'gzip nombreArchivo: Comprime un archivo en formato .gz sustituyendo el archivo original.' + '\n' + 'gzip nombreArchivo > /Ruta_especifica: Comprime un archivo en una ubicación específica.' + '\n' + '   -c: Conserva el archivo original.' + '\n' + '   -r: Compresión recursiva (Solo archivos individuales)' + '\n' + '   -v: Muestra la taza de compresión en la salida.' + '\n' + '   -rl: Permite consultar la taza de compresión de un archivo.' + '\n' + '#' + '\n' + 'gunzip -l archivo.gz: Permite ver la taza de compresión de un archivo.' + '\n' + '#' + '\n' + 'zcat: Permite ver el contenido de un archivo comprimido.' + '\n' + '   -f: Permite ver el contenido de un archivo no comprimido.' + '\n' + '#' + '\n' + 'gunzip | bunzip2 [nombreArchivo/Carpeta] = gzip -d [nombreArchivo/Carpeta]: Descomprime un archivo.' + '\n' + '#' + '\n' + 'bzip2 [nombreArchivo/carpeta]: Comprime archivos o carpetas (.bz2)' + '\n' + '   -l: Muestra el radio de compresión.' + '\n' + '   -v: Ver la compresión en la terminal.' + '\n' + '   -d: Aplica la descompresión.' + '\n' + '#' + '\n' + 'bzcat: Ver el contenido de un archivo comprimido .bz2' + '\n' + '#' + '\n' + 'xz [nombreArchivo/Carpeta]: Crea un archivo comprimido .xz' + '\n' + '#' + '\n' + 'unxz [nombreArchivo/Carpeta]: Descomprimir un archivo' + '\n' + '#' + '\n' + 'tar -cf  NombreArchivo/Carpeta.tar [NombreArchivo/Carpeta]' + '\n' + '   -c: Crear un archivo' + '\n' + '   -v: Mostrar lo que está haciendo.' + '\n' + '   -f NombreArchivo/Carpeta.tar: Especificar el nombre del archivo tar.' + '\n' + '   -t: Mostrar el contenido del archivo tar.' + '\n' + '   -z: Crear un archivo tar comprimido (.gz).' + '\n' + '   -j: Crear un archivo tar comprimido (.bz2).' + '\n' + '   -x: Extraer los datos de un archivo' + '\n' + '   -r: Añadir un archivo/carpeta a un archivo existente.' + '\n' + '   -C Carpeta_Destino: Permite elegir la carpeta donde se extraen los archivos.' + '\n' + '#' + '\n' + 'zip [nombreArchivo].zip [nombreCarpeta]/*: Comprime los archivos de una carpeta.' + '\n' + '   -r: Indica que se debe usar recursividad.' + '\n' + '#' + '\n' + 'unzip -l [nombreArchivo].zip: Lista los archivos dentro de un zip.' + '\n' + '#' + '\n' + 'unzip [nombreArchivo].zip: Extrae los archivos comprimidos.';

txt_ejemplo_instalacion[7] = '#Ver id de usuario y grupos a los que pertenece el usuario activo.' + '\n' + 'id' + '\n' + '#' + '\n' + '#Grupos a los que pertenece el usuario activo o un usuario específico.' + '\n' + 'groups' + '\n' + '#' + '\n' + '#Ver los grupos que tiene el sistema.' + '\n' + 'cat etc/group' + '\n' + '#' + '\n' + '#Permite cambiar de usuario.' + '\n' + 'su [opciones] [usuario]' + '\n' + '	- | -l | --login: Cargar todo el entorno del usuario' + '\n' + '#' + '\n' + '#Cambiar el dueño de un archivo o carpeta.' + '\n' + 'chown [usuario]:[grupo] [opciones] [nombreArchivo/Carpeta]' + '\n' + '	-R: Cambia los permisos de manera recursiva.' + '\n' + '#' + '\n' + '#Cambiar el grupo dueño de un archivo' + '\n' + 'chgrp [grupo] [nombreArchivo/Carpeta]' + '\n' + '#' + '\n' + '#Ver las propiedades de los archivos listados' + '\n' + 'ls -l' + '\n' + '#' + '\n' + '[-][rwx][r-x][r-x] [USUARIO] [GRUPO] [FECHA] [NOMBRE_ ARCHIVO]' + '\n' + '	Primer campo: tipo de archivo' + '\n' + '	Segundo campo: Permisos de usuario (u)' + '\n' + '	Tercer campo: Permisos de grupo (g)' + '\n' + '	Cuarto espacio: Otros (o)' + '\n' + 'lectura: r = 4' + '\n' + 'Escritura: w = 2' + '\n' + 'Ejecución: x = 1' + '\n' + 'Total: rwx = 7' + '\n' + '#' + '\n' + 'Group Symbol		Operation Symbol			        Permission Symbol   	    Value' + '\n' + 'u (user owner)		+ (add the permission)			        r (read)                  4' + '\n' + 'g (group owner)		= (specify the exact permission)	w (write)                 2' + '\n' + 'o (others)			- (remove the permission)		        x (execute)               1' + '\n' + 'a (all)									                s (setgid)' + '\n' + '									                        t (sticky bit)' + '\n' + '#' + '\n' + '#Cambiar permisos a un archivo o directorio.' + '\n' + 'chmod MODE FILE...' + '\n' + '#' + '\n' + '#Quitar los permisos de lectura para otros usuarios.' + '\n' + 'chmod o-r FILE...' + '\n' + '#' + '\n' + '#Agregar permisos de lectura y escritura a otros usuarios.' + '\n' + 'chmod o+rw FILE...' + '\n' + '#' + '\n' + '#Asignar permisos de setgid para el grupo a una carpeta.' + '\n' + 'chmod g+s [DIRECTORY...]' + '\n' + '#' + '\n' + '#Asignar propiedad de sticky bit a otros usuarios.' + '\n' + 'chmod o+t [DIRECTORY...]' + '\n' + '#' + '\n' + '#Cambiar los permisos a un directorio.' + '\n' + 'chmod [[#u][#g][#o]] = [###] DIRECTORY...' + '\n' + '#' + '\n' + '#Solo los miembros del grupo y el usuario dueño pueden ver el archivo.' + '\n' + 'chmod 770 DIRECTORY...';

txt_ejemplo_instalacion[8] = '#Terminal CLI (Command Line Interface)' + '\n' +
    '#' + '\n' +
    '# - crtl + r: Buscar comandos anteriores' + '\n' +
    '# - ctrl + a: Inicio de linea.' + '\n' +
    '# - ctrl + e: Final de la linea.' + '\n' +
    '#' + '\n' +
    '#Cambiar de usuario en la linea de comandos.' + '\n' +
    'sudo su' + '\n' +
    '#' + '\n' +
    '#Despliega información del sistema.' + '\n' +
    'uname -a' + '\n' +
    '#      -s: Muestra el kernel.' + '\n' +
    '#      -p: Muestra el tipo de procesador.' + '\n' +
    '#      -i: Muestra la plataforma del hardware.' + '\n' +
    '#      -m: Muestra la arquitectura.' + '\n' +
    '#      -r: Muestra la versión del kernel.' + '\n' +
    '#' + '\n' +
    '#Muestra el tipo de comando.' + '\n' +
    'type [comando]' + '\n' +
    '#' + '\n' +
    '#Muestra la ubicación del ejecutable del comando.' + '\n' +
    '# which [comando]' + '\n' +
    '#' + '\n' +
    '#Historial de comandos' + '\n' +
    'history' + '\n' +
    '#' + '\n' +
    '#Muestra los últimos cinco comandos de la lista del historial' + '\n' +
    'history 5' + '\n' +
    '#' + '\n' +
    '#Ejecuta el último comando otra vez' + '\n' +
    '!!' + '\n' +
    '#' + '\n' +
    '#Ejecuta el quinto comando desde la parte inferior de la lista de historial' + '\n' +
    '!-5' + '\n' +
    '#' + '\n' +
    '#Ejecuta el comando ls más reciente' + '\n' +
    '!ls' + '\n' +
    '#' + '\n' +
    '#Limpiar el historial.' + '\n' +
    'history -c' + '\n';

txt_ejemplo_instalacion[9] = '#Moverse hacia la carpeta /var/www/html' + '\n' +
    'cd /var/www/html' + '\n' +
    '#Descargar nextcloud a esta ubicación y descomprimir' + '\n' +
    'sudo wget -c https://download.nextcloud.com/server/releases/nextcloud-21.0.1.zip' + '\n' +
    '#Listamos el contenido de la carpeta para ver el archivo descargado' + '\n' +
    '#' + '\n' +
    'ls -l' + '\n' +
    '#' + '\n' +
    'sudo unzip nextcloud-21.0.1.zip' + '\n' +
    '#' + '\n' +
    '#' + '\n' +
    '#Otorgar permisos a las carpetas' + '\n' +
    'sudo chown -R www-data:www-data /var/www/html' + '\n' +
    'sudo chmod -R 775 /var/www/html' + '\n';


txt_ejemplo_instalacion[10] = '#Utilizaremos el comando iptables para crear un firewall básico de seguridad.' + '\n' +
    '#' + '\n' +
    '#Lo primero que haremos antes de instalar es verificar que el sistema está' + '\n' +
    '#actualizado' + '\n' +
    'sudo apt update' + '\n' +
    '#Si ahy actualizaciones pendientes las revisamos y las instalamos' + '\n' +
    'sudo apt upgrade' + '\n' +
    '#' + '\n' +
    '#Notese que apt update compara las versiones de los programas instalados en' + '\n' +
    '#nuestro server con respceto al las disponibles en los repositorios' + '\n' +
    '#configurados en el archivo /etc/apt/sources.list o en los archivos dentro de' + '\n' +
    '#la carpeta /etc/apt/sources.list.d/' + '\n' +
    '#' + '\n' +
    '#Instalamos nmap que es una herramiento de monitores de puertos de red y mucho mas' + '\n' +
    'sudo apt install nmap' + '\n' +
    '#Se instala chkrootkit y rkhunter para moniterear el server de posibles rootkits' + '\n' +
    'sudo apt install rkhunter chkrootkit' + '\n' +
    '#Instalamos iptables' + '\n' +
    'sudo apt install iptables' + '\n' +
    '#Listamos las reglas instaladas por defecto ' + '\n' +
    'sudo iptables -L -n -v' + '\n' +
    '#' + '\n' +
    '#Nos aseguramos de estar en $HOME ejecutando cd sin argumentos' + '\n' +
    'cd' + '\n' +
    '#' + '\n' +
    '#Descargamos el script con los comandos para implemntar el firewall ' + '\n' +
    'wget -c https://1drv.ms/u/s!AqLuj9KHIzF-ha99fdcLENb3h-dDLA?e=rerjjW' + '\n' +
    '#' + '\n' +
    '#Lo ejecutamos como superusuario' + '\n' +
    'sudo bash firewall-iptables.sh' + '\n' +
    '#' + '\n' +
    '#Instalamos iptables-persistent para guardar las reglas actuales' + '\n' +
    'sudo apt install iptables-persistent' + '\n' +
    '#' + '\n' +
    '#Nos preguntará si guardamos las reglas actuales a los archivos ' + '\n' +
    '#/etc/iptables/rules.v4 y /etc/iptables/rules.v6, le decimos que si' + '\n' +
    '#' + '\n' +
    '#Ejecutamos el siguiente comando para que las reglas sean permanetes' + '\n' +
    'sudo netfilter-persistent save' + '\n' +
    '#' + '\n';

txt_ejemplo_instalacion[11] = '#Nos aseguramos de que el usuario root no se pueda conectar remotamente, esto con el' + '\n' +
    '#objetivo de elimiar superficies de ataque ya que el usuario root existe en' + '\n' +
    '#todos los linux y es común que sea sujeto de ataques de fuerza bruta' + '\n' +
    '#' + '\n' +
    'sudo vi /etc/ssh/sshd_config' + '\n' +
    '#Modificamos la directiva deseada' + '\n' +
    'PermitRootLogin no' + '\n' +
    '#' + '\n' +
    '#guardamos y cerramos el archivo con :wq! y reiniciamos el servicio de ssh' + '\n' +
    'sudo systemctl restart sshd' + '\n' +
    '#' + '\n' +
    '#Si perdemos la conexión simplemente volvemos a iniciar sesion como se hizo' + '\n' +
    '#anteriromente' + '\n';

txt_ejemplo_instalacion[12] = '#Instalamos fail2ban para agregar una capa extra de protección contra ataques' + '\n' +
    '#de fuerza bruta y DOS -  DDOS.' + '\n' +
    'sudo apt install fail2ban' + '\n' +
    'sudo cp -a /etc/fail2ban/jail.conf /etc/fail2ban/jail.local' + '\n' +
    '#En /etc/fail2ban/jail.local realizamos nuestras personalizaciones si queremos' + '\n' +
    '#En nuestro casi dejaremos las personalizaciones por defecto. Si se hace algún cambio ' + '\n' +
    '#en el archivo jail.conf se debe reiniciar el servicio. ' + '\n' +
    '#' + '\n' +
    '#Reiniciamos el servicio de fail2ban' + '\n' +
    'sudo systemctl restart fail2ban' + '\n' +
    '#' + '\n' +
    '#fail2ban se puede configurar no solo apra proteger accesos a través de ssh pero' + '\n' +
    '#si se desea saber más, puede leer el manual del comando.' + '\n' +
    'man fail2ban' + '\n';

    /**
     * #Dirige por defecto al directorio home del usuario
    cd

    #Vuelve a la carpeta anterior.
    cd ..

    #navegar a una ruta especifica.
    cd /ruta

    #Lista los archivos y carpetas del directorio actual
    ls

    #Lista el contenido de carpeta en lugar del actual
    ls /carpeta
        -a: Permite ver los archivos ocultos.
        -l: Incluye datos de quién es el dueño de un archivo, el tamaño y la última vez que se modificó el contenido.
        -lh: Muestra el tamaño del archivo en megabytes o gigabytes
        -ld /carpeta: lista el directorio /carpeta sin los archivos que tiene dentro.
        -R: Listado recursivo
        -S: Ordenar los archivos por tamaño.
        -t: Ordena los archivos por fecha de modificación.
        -t --full time: Muestra la fecha y hora completas.
        -r: Lista los archivos de los menos a los mas pesados.
        -d: el comando no muestra el contenido de un directorio, sino más bien el nombre del directorio.
        -l /etc/ppp | tail -5 | nl: tail -5: Capta las ultimas 5 lineas del comando ls, y nl las enumera del 1 al 5.
        -r: Ordenar los archivos de menor a mayor.

    #Muestra el tipo de archivo.
    file [archivo]

    #Crea un archivo vacio o modifica la fecha de modificación si ya existe el archivo.
    touch [nombreArchivo]: 
        -t [aaaammddhhmm]: Cambia el mtime y el atime.
        -a [aaaammddhhmm]: Cambia el atime sin modificar el mtime.
        -c [aaaammddhhmm]: Cambia el valor del mtime, ctime y atime.

    #Timestamps
        atime: Ultimo acceso.
        mtime: Ultima modificación.
        ctime: Ultimos cambios en los atributos.

    #Muestra información de los diferentes timestamps.
    stat [nombreArchivo]

    # Copiar archivos de un directorio a otro
    cp [fuente] [destino]
        -v: Produce una salida en caso de ser exitoso.
        -i: El comando emitirá un prompt antes de sobrescribir un archivo.
        -r: Copiará los archivos y los directorios.
        -ra: Mantiene los atributos de los archivos.

    mv [fuente] [destino]: Mover un archivo de una carpeta a otra.
        -i: Movimiento interactivo: pregunta si un archivo debe sobrescribirse.
        -n: No sobrescribir el contenido de los archivos de destino.
        -v: Verbose: muestra el movimiento resultante.

    mv [nombreArchivo] [nuevoNombre]: Renombrar un archivo.

    touch [nombreArchivo]: Crear un archivo vacio.

    rm [nombreArchivo]: Eliminar un archivo
        -i: Preguntar si se desea eliminar un archivo.
        -r [nombreDirectorio]: Eliminar un directorio.

    rmdir [nombreDirectorio]: Elimina un directorio si está vacio.
        -p: Remover un directorio con otro dentro.
        -rf: Elimina una carpeta con contenido.

    mkdir [nombreDirectorio]: Crear un directorio.
        -p: Crea una carpeta dentro de otra que no existe.

        
    echo /etc/t*: Ver archivos en el directorio etc que empiecen con la letra t.

    #Buscar archivos con extensiones de tres letras
    echo /etc/*.???: Buscar archivos con extensiones de tres letras.
    
    echo /etc/[a-d]*: Mostrar todos los archivos que comiencen con cualquier letra entre a y d.

    echo [!DP]*: 
 */

txt_ejemplo_instalacion[13] = '#Dirige por defecto al directorio home del usuario' + '\n' +
    'cd' + '\n' +
    '#' + '\n' +
    '#Vuelve a la carpeta anterior.' + '\n' +
    'cd ..' + '\n' +
    '#' + '\n' +
    '#navegar a una ruta especifica.' + '\n' +
    'cd /ruta' + '\n' +
    '#' + '\n' +
    '#Lista los archivos y carpetas del directorio actual' + '\n' +
    'ls' + '\n' +
    '#' + '\n' +
    '#Lista el contenido de carpeta en lugar del actual' + '\n' +
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
    '#' + '\n' +
    '#Muestra el tipo de archivo.' + '\n' +
    'file [archivo]' + '\n' +
    '#' + '\n' +
    '#Copia un archivo de un directorio a otro.' + '\n' +
    'cp [fuente] [destino]' + '\n' +
    '        -v: Muestra un mensaje si el archivo se copia correctamente.' + '\n' +
    '        -i: Pregunta antes de sobrescribir un archivo.' + '\n' +
    '        -r: Copia los archivos y los directorios.' + '\n' +
    '        -ra: Mantiene los atributos de los archivos.' + '\n' +
    '#' + '\n' +
    '#Mueve un archivo de un directorio a otro.' + '\n' +
    'mv [fuente] [destino]' + '\n' +
    '        -i: Movimiento interactivo: pregunta si un archivo debe sobrescribirse.' + '\n' +
    '        -n: No sobrescribir el contenido de los archivos de destino.' + '\n' +
    '        -v: Verbose: muestra el movimiento resultante.' + '\n' +
    '#' + '\n' +
    '#Renombra un archivo.' + '\n' +
    'mv [nombreArchivo] [nuevoNombre]' + '\n' +
    '#' + '\n' +
    '#Crea un archivo vacio.' + '\n' +
    'touch [nombreArchivo]' + '\n' +
    '#' + '\n' +
    '#Elimina un archivo.' + '\n' +
    'rm [nombreArchivo]' + '\n' +
    '        -i: Pregunta antes de eliminar un archivo.' + '\n' +
    '        -r [nombreDirectorio]: Elimina un directorio.' + '\n' +
    '        -rf: Elimina una carpeta con contenido.' + '\n' +
    '        -p: Remover un directorio con otro dentro.' + '\n' +
    '#' + '\n' +
    '#Crea un directorio.' + '\n' +
    'mkdir [nombreDirectorio]' + '\n' +
    '        -p: Crea una carpeta dentro de otra que no existe.' + '\n' +
    '        -m: Crea una carpeta con permisos de solo lectura.' + '\n' +
    '        -v: Muestra el nombre del directorio que se crea.' + '\n' +
    '#' + '\n' +
    '#Elimina un directorio si esta vacio.' + '\n' +
    'rmdir [nombreDirectorio]' + '\n' +
    '        -i: Pregunta antes de eliminar un directorio.' + '\n' +
    '        -p: Elimina un directorio con otro dentro.' + '\n' +
    '        -v: Muestra el nombre del directorio que se elimina.' + '\n' +
    '#' + '\n' +
    '#Crear un directorio.' + '\n' +
    'mkdir [nombreDirectorio]' + '\n' +
    '        -p: Crea una carpeta dentro de otra que no existe.' + '\n' +
    '        -m: Crea una carpeta con permisos de solo lectura.' + '\n' +
    '        -v: Muestra el nombre del directorio que se crea.' + '\n' +
    '#' + '\n' +
    '#Ver archivos en el directorio etc que empiecen con la letra t.' + '\n' +
    'echo /etc/t*' + '\n' +
    '#' + '\n' +
    '#Buscar archivos con extensiones de tres letras' + '\n' +
    'echo /etc/*.???' + '\n' +
    '#' + '\n' +
    '#Mostrar todos los archivos que comiencen con cualquier letra entre a y d.' + '\n' +
    'echo /etc/[a-d]*' + '\n' +
    '#' + '\n' +
    /**#Enviar mensaje por consola
    echo The service costs \$100 and the path is $PATH
        The service costs $100 and the path is /usr/bin/custom:/home/sysadmin/bin:...


    echo *: Todos los archivos
    echo ???: Archivos que tienen tres caracteres.
    echo [PTM]*: Archivos que empiezan con P, T O M.
    [ASCII characters] */
    '#' + '\n' +
    '#Enviar mensaje por consola' + '\n' +
    'echo The service costs \$100 and the path is $PATH' + '\n' +
    '        The service costs $100 and the path is /usr/bin/custom:/home/sysadmin/bin:...' + '\n' +
    '#' + '\n' +
    '#Todos los archivos' + '\n' +
    'echo *' + '\n' +
    '#' + '\n' +
    '#Todos los archivos que tienen tres caracteres' + '\n' +
    'echo ???' + '\n' +
    '#' + '\n' +
    '#Archivos que empiezan con P, T O M' + '\n' +
    'echo [PTM]' + '\n' +
    '#' + '\n' +
    '#[!, ^]: Para negar' + '\n' +
    '#Mostrar cualquier archivo que no comienza con D o P.'
    'echo /etc/[^DP]*' + '\n';









// On document ready
$(document).ready(function () {
    // Ocultar todos los .copiar
    $('.copiar').hide();

    activar_tooltips();

    //Bootstrap 5.2
    //Mostrar el modal info_charla
    $('#info_charla').modal('show');
});

/**Mostrar ejemplo */
function mostrar_ejemplo() {
    if (elemento != 'ejemplo') {
        if (elemento == 'utilidades') {
            mostrar_utilidades();
        }

        if (elemento == 'seguridad') {
            mostrar_seguridad();
        }

        // Collapse todos los .ejemplo
        $('.ejemplo').collapse('hide');

        // Mostrar el collapse de ejemplo
        $('#ejemplo').collapse('show');

        elemento = 'ejemplo';
    } else { // Ocultar el collapse de ejemplo
        $('#ejemplo').collapse('hide');

        // Ocultar el boton de copiar
        $('.copiar').hide();

        elemento = null;
    }
}

/**Mostrar las utilidades */
function mostrar_utilidades() {
    if (elemento != 'utilidades') {
        if (elemento == 'ejemplo') {
            mostrar_ejemplo();
        }

        if (elemento == 'seguridad') {
            mostrar_seguridad();
        }

        // Collapse todos los .ejemplo
        $('.ejemplo').collapse('hide');

        // Mostrar el collapse de utilidades
        $('#utilidades').collapse('show');

        // Ocultar el boton de copiar
        $('.copiar').hide();

        elemento = 'utilidades';
    } else { // Ocultar el collapse de utilidades
        $('#utilidades').collapse('hide');

        elemento = null;
    }
}

/**Mostrar la seguridad */
function mostrar_seguridad() {
    if (elemento != 'seguridad') {
        if (elemento == 'ejemplo') {
            mostrar_ejemplo();
        }

        if (elemento == 'utilidades') {
            mostrar_utilidades();
        }

        // Collapse todos los .ejemplo
        $('.ejemplo').collapse('hide');

        // Mostrar el collapse de seguridad
        $('#seguridad').collapse('show');

        // Ocultar el boton de copiar
        $('.copiar').hide();

        elemento = 'seguridad';
    } else { // Ocultar el collapse de seguridad
        $('#seguridad').collapse('hide');

        elemento = null;
    }
}
/** Mostrar el ejemplo de la instalación de paquetes */
function ejemplo(nombre_ejemplo = '') {
    if (ejemplo_activo == nombre_ejemplo) {
        $('#ejemplo_' + ejemplo_activo).collapse('hide');
        // Ocultar el boton de copiar
        $('#copiar_' + ejemplo_activo).hide();

        ejemplo_activo = null;
        texto_copiar = null;
    } else { // Cerrar todos los ejemplos
        $('.ejemplo').collapse('hide');

        // Ocultar el boton de copiar
        $('.copiar').hide();

        // Mostrar el collapse de ejemplo de ejemplo
        $('#ejemplo_' + nombre_ejemplo).collapse('show');

        // Mostrar el boton de copiar
        $('#copiar_' + nombre_ejemplo).show();

        // Limpiar el elemento
        $('.terminal-' + nombre_ejemplo).empty();

        switch (nombre_ejemplo) {
            case 'apache':
                CodeMirror(document.querySelector('.terminal-apache'), {
                    lineNumbers: true,
                    tabSize: 2,
                    value: txt_ejemplo_instalacion[0],

                    mode: 'shell',
                    theme: 'monokai'
                });

                texto_copiar = txt_ejemplo_instalacion[0];
                break;

            case 'php':
                CodeMirror(document.querySelector('.terminal-php'), {
                    lineNumbers: true,
                    tabSize: 2,
                    value: txt_ejemplo_instalacion[1],

                    mode: 'shell',
                    theme: 'monokai'
                });

                texto_copiar = txt_ejemplo_instalacion[1];
                break;

            case 'crear_usuario':
                CodeMirror(document.querySelector('.terminal-crear_usuario'), {
                    lineNumbers: true,
                    tabSize: 2,
                    value: txt_ejemplo_instalacion[2],

                    mode: 'shell',
                    theme: 'monokai'
                });

                texto_copiar = txt_ejemplo_instalacion[2];
                break;

            case 'mysql':
                CodeMirror(document.querySelector('.terminal-mysql'), {
                    lineNumbers: true,
                    tabSize: 2,
                    value: txt_ejemplo_instalacion[3],

                    mode: 'shell',
                    theme: 'monokai'
                });

                texto_copiar = txt_ejemplo_instalacion[3];
                break;

            case 'vi':
                CodeMirror(document.querySelector('.terminal-vi'), {
                    lineNumbers: true,
                    tabSize: 2,
                    value: txt_ejemplo_instalacion[4],

                    mode: 'shell',
                    theme: 'monokai'
                });

                texto_copiar = txt_ejemplo_instalacion[4];
                break;

            case 'phpmyadmin':
                CodeMirror(document.querySelector('.terminal-phpmyadmin'), {
                    lineNumbers: true,
                    tabSize: 2,
                    value: txt_ejemplo_instalacion[5],

                    mode: 'shell',
                    theme: 'monokai'
                });

                texto_copiar = txt_ejemplo_instalacion[5];
                break;

            case 'paquetes':
                // Limpiar el elemento
                $('.terminal-paquetes').empty();

                var txt_paquetes = '#Administración de paquetes.' + '\n' + 'apt-get' + '\n \n' + '#Obtener una lista actualizada de estos repositorios de Internet.' + '\n' + 'sudo apt-get update' + '\n \n' + '#Buscar palabras clave dentro de los repositorios.' + '\n' + 'sudo apt-cache search [keyword]' + '\n \n' + '#Instalar un paquete.' + '\n' + 'sudo apt-get install [package]' + '\n \n' + '#Actualizar todos los paquetes posibles.' + '\n' + 'sudo apt-get upgrade' + '\n \n' + '#Eliminar todos los archivos de un paquete de software.' + '\n' + 'sudo apt-get remove [package]' + '\n' + '   --purge: Elimina los archivos de configuración de un paquete de software.';

                CodeMirror(document.querySelector('.terminal-paquetes'), {
                    lineNumbers: true,
                    tabSize: 2,
                    value: txt_paquetes,

                    mode: 'shell',
                    theme: 'monokai'
                });

                texto_copiar = txt_paquetes;
                break;

            case 'compresion':
                // Limpiar el elemento
                $('.terminal-compresion').empty();

                var txt_compresion = txt_ejemplo_instalacion[6];

                CodeMirror(document.querySelector('.terminal-compresion'), {
                    lineNumbers: true,
                    tabSize: 2,
                    value: txt_compresion,

                    mode: 'shell',
                    theme: 'monokai'
                });

                texto_copiar = txt_compresion;
                break;

            case 'permisos':
                // Limpiar el elemento
                $('.terminal-permisos').empty();

                var txt_permisos = txt_ejemplo_instalacion[7];

                CodeMirror(document.querySelector('.terminal-permisos'), {
                    lineNumbers: true,
                    tabSize: 2,
                    value: txt_permisos,

                    mode: 'shell',
                    theme: 'monokai'
                });

                texto_copiar = txt_permisos;
                break;

            case 'cli':
                // Limpiar el elemento
                $('.terminal-cli').empty();

                var txt_cli = txt_ejemplo_instalacion[8];

                CodeMirror(document.querySelector('.terminal-cli'), {
                    lineNumbers: true,
                    tabSize: 2,
                    value: txt_cli,

                    mode: 'shell',
                    theme: 'monokai'
                });

                texto_copiar = txt_cli;
                break;

            case 'obtener':
                // Limpiar el elemento
                $('.terminal-obtener').empty();

                var txt_obtener = txt_ejemplo_instalacion[9];

                CodeMirror(document.querySelector('.terminal-obtener'), {
                    lineNumbers: true,
                    tabSize: 2,
                    value: txt_obtener,

                    mode: 'shell',
                    theme: 'monokai'
                });

                texto_copiar = txt_obtener;
                break;

            case 'firewall':
                // Limpiar el elemento
                $('.terminal-firewall').empty();

                var txt_firewall = txt_ejemplo_instalacion[10];

                CodeMirror(document.querySelector('.terminal-firewall'), {
                    lineNumbers: true,
                    tabSize: 2,
                    value: txt_firewall,

                    mode: 'shell',
                    theme: 'monokai'
                });

                texto_copiar = txt_firewall;
                break;

            case 'ingreso':
                // Limpiar el elemento
                $('.terminal-ingreso').empty();

                var txt_ingreso = txt_ejemplo_instalacion[11];

                CodeMirror(document.querySelector('.terminal-ingreso'), {
                    lineNumbers: true,
                    tabSize: 2,
                    value: txt_ingreso,

                    mode: 'shell',
                    theme: 'monokai'
                });

                texto_copiar = txt_ingreso;
                break;

            case 'fuerza':
                // Limpiar el elemento
                $('.terminal-fuerza').empty();

                var txt_fuerza = txt_ejemplo_instalacion[12];

                CodeMirror(document.querySelector('.terminal-fuerza'), {
                    lineNumbers: true,
                    tabSize: 2,
                    value: txt_fuerza,

                    mode: 'shell',
                    theme: 'monokai'
                });

                texto_copiar = txt_fuerza;
                break;

            case 'gestion_archivos':
                // Limpiar el elemento
                $('.terminal-gestion_archivos').empty();

                var txt_gestion_archivos = txt_ejemplo_instalacion[13];

                CodeMirror(document.querySelector('.terminal-gestion_archivos'), {
                    lineNumbers: true,
                    tabSize: 2,
                    value: txt_gestion_archivos,

                    mode: 'shell',
                    theme: 'monokai'
                });

                texto_copiar = txt_gestion_archivos;
                break;

        }

        ejemplo_activo = nombre_ejemplo;
    } // Fin else
}
// Fin de la funcion

/**Copiar el ejemplo de la instalacion de paquetes */
function copiar_texto() {
    if (texto_copiar != null) {
        var texto = texto_copiar;

        // Copiar el texto del ejemplo de instalacion
        var texto_copiado = document.createElement('textarea');
        texto_copiado.value = texto;
        document.body.appendChild(texto_copiado);
        texto_copiado.select();
        document.execCommand('copy');
        texto_copiado.remove();

        // Mostrar notificacion de copiado
        notificacion('Copiado al portapapeles', '', 'success');
    } else {
        notificacion('No hay texto para copiar', '', 'error');
    }
}

function descargar_archivo(archivo = null) {
    //Abrir en una nueva pestana el archivo
    if (archivo != null) {
        window.open(archivo, '_blank');
    }
}

/**Activar tooltips */
function activar_tooltips() {
    $(function () {
        $('[data-bs-toggle="tooltip"]').tooltip()
    });
}

/**Mostrar una notificacion al usuario */
function notificacion(titulo, mensaje, icono) {
    Toast.fire({ icon: icono, title: titulo, text: mensaje })
}
