const direccion_web = 'https://linux.jcampos.me/';

/**
 * Función que carga el contenido de un archivo HTML en otro
 */
function includeHTML() {
    loaded = false;
    let z, i, elmnt, file, xhttp;
    /* Loop through a collection of all HTML elements: */
    z = document.getElementsByTagName("*");
    for (i = 0; i < z.length; i++) {
        elmnt = z[i];
        /*search for elements with a certain atrribute:*/
        file = elmnt.getAttribute("include-html");
        if (file) {
            /* Make an HTTP request using the attribute value as the file name: */
            xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        elmnt.innerHTML = this.responseText;
                    }
                    if (this.status == 404) {
                        elmnt.innerHTML = "Page not found.";
                    }
                    /* Remove the attribute, and call this function once more: */
                    elmnt.removeAttribute("include-html");
                    includeHTML();
                }
            }
            xhttp.open("GET", file, true);
            xhttp.send();

            return;
        }
    }

    //loaded = true;
    activar_tooltips();

    cargar_direccion();

    //Bootstrap 5.2
    //Mostrar el modal info_charla
    //$('#info_charla').modal('show');

    $('.copiar').hide();
}

/**
 * Función que activa los tooltips de bootstrap
 */
function activar_tooltips() {
    $(function () {
        $('[data-bs-toggle="tooltip"]').tooltip()
    });
}

function mostrar_compartir() {
    $('#modal_compartir').modal('show');
}

//Cargar el contenido de los archivos HTML en el index.html
includeHTML();

/**
 * Función que carga la dirección web en el input con id direccion_web
 */
function cargar_direccion(){
    //Colocar la dirección web en el input con id direccion_web
    $('#direccion_web').val(direccion_web);
}

/**
 * Función que copia la dirección web al portapapeles
 */
function copiar_direccion(){
    var web_page = direccion_web;

    console.log('Copiar dirección web: ' + web_page);

    // Copiar la dirección web al portapapeles
    copiar(web_page).then(r => {
        notification('Dirección web copiada', '', 'success');
    });
}

/**
 * Función que copia el texto al portapapeles
 * @param texto texto a copiar
 */

async function copiar(texto){
    if (texto != null) {
        texto = texto.trim();

        try{
         await navigator.clipboard.writeText(texto);
        } catch (err) {
            notification('No se pudo copiar al portapapeles', '', 'error');
        }
    } else {
        notification('No hay texto para copiar', '', 'error');
    }
}

