/* #Ayuda de comandos
                            #Ver pagina man de un comando
                            man [comando]
                                Return (o Intro)	Bajar una línea
                                Space (o Espacio)	Bajar una página
                                /term(o /término)	Buscar un término
                                n	Buscar el siguiente elemento de la búsqueda
                                1G	Ir a Inicio
                                G	Ir a la final
                                h	Mostrar ayuda
                                q	Cerrar página man

                            man -f comando = whatis comando: Busca paginas man con el nombre específico y muestra la sección.
                            man -k palabra_clave: Muestra paginas man que tienen esa palabra en parte de su nombre.

                            man [seccion] [comando]: Muestra la página man de una sección específica.
                                1. Executable programs or shell commands
                                2. System calls (functions provided by the kernel)
                                3. Library calls (functions within program libraries)
                                4. Special files (usually found in /dev)
                                5. File formats and conventions, e.g., /etc/passwd
                                6. Games
                                7. Miscellaneous (including macro packages and conventions), e.g., man(7), groff(7)
                                8. System administration commands (usually only for root)
                                9. Kernel routines [non-standard]

                            apt install manpages-es-extra: Instalar español para paginas man.
                            man -L es [comando]: Ver páginas man en español.

                            info command: Muestra la documentación info de un comando.
                                Flecha abajo ↓	Bajar una línea
                                Espacio	Bajar una página
                                s	Buscar un término
                                [	Ir al nodo anterior
                                ]	Vaya al siguiente nodo
                                u	Subir un nivel
                                TABULADOR	Saltar al siguiente hipervínculo
                                INICIO	Ir a inicio
                                FIN	Ir al final
                                h	Mostrar ayuda
                                L	Cerrar la página de ayuda
                                q	Cerrar el comando info

                            whereis comando: busca los comandos, archivos de código fuente y las páginas man en las ubicaciones donde estos archivos se almacenan.
                            comando --help: Muestra información básica del comando
                        */

//Ayuda de comandos
txt_ejemplo_instalacion[11] = '#' + '\n' +
    '#Ayuda de comandos' + '\n' +
    '#' + '\n' +
    '#Ver pagina man de un comando' + '\n';

