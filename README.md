# OGame-Player-Scanner-Chrome-Extension

![alt text](https://github.com/gayoso/OGame-Planet-Scanner-Chrome-Extension/blob/main/preview.png?raw=true)

A Scanner tool to help you and your alliance conquer your OGame server.

To install download the .zip release and extract it. There should be a folder named "player-scanner-extension".
Open Chrome and go to Settings->Extensions and toggle "Developer mode" to "On".
Press "Load unpacked" on the top left and choose the "chrome-extension" directory (the one with a manifest.json file).
All done!

On the Galaxy screen of OGame open the extension.
The first input fields configure the scan: start and max galaxy (default 1-5), start and max system (default 1-499).
Click interval (milliseconds) is how fast the scanner moves through the systems. Set it too fast and it will miss planets.
Tested with 1000 ms and 500 ms working on my pc.

The Scan button starts the scanning of planets. Just press it and leave it running for 20-40 minutes.
Pro tip: make the chrome window small but don't minimize it and keep it open so you can scan in background.

The scan will stop automatically when it finishes all galaxies and systems, or you can press the Stop button.
Save Scan stores the scan results in local storage (available only on this pc).
WARNING: if you press Stop and Save an incomplete scan, the scanner will think that those are the only planets in the universe.

The scanner always keeps two scans saved: a Last Scan and a Current Scan. When pressing Save, the previous Current Scan is moved to the Last Scan slot, and the new scan you are saving is saved on the Current Scan slot.
This is to be able to compare them, and check for changes in the unvierse.

The Export and Import buttons export/import both scans as a json file, like:
{
    "currentScan": {
        "datetime": "YYYY-MM-DD hh:mm",
        "planets": {
            "1.1.1": "player1",
            "1.1.12": "player2",
            ...
        },
        "players": {
            "player1": {
                "alliance": "",
                "planets": [
                    {
                        "coords": "1.75.12",
                        "datetime": "YYYY-MM-DD hh:mm",
                        "name": "Main Planet"
                    },
                    {
                        ...
                    },
                    ...
                ]
            },
            "player2": {
                ...
            },
            ...
        }
    },
    "lastScan": {
        ...
    }
}

Once there are two scans stored, the Scan Differences table shows each planet in a row, with player info and an Alert if anything about the planet changed since the last scan.
You can use the text filter to find a query string in any of the fields of a row (planet name, player name, etc) and the checkboxes to displace only rows with those alerts (new planets, destroyed planets, changed alliance, changed player name, changed planet name).

-------------------


Una herramienta de escaneo para ayudarte a ti y a tu alianza a conquistar tu servidor de OGame.

Instrucciones de Instalación:
Descarga la versión en formato .zip y extráela. Deberías encontrar una carpeta llamada "player-scanner-extension".
Abre Chrome y ve a Configuración -> Extensiones, y activa el modo "Desarrollador".
Haz clic en "Cargar descomprimida" en la esquina superior izquierda y selecciona la carpeta "player-scanner-extension" (la que contiene el archivo manifest.json).
¡Listo!

Cómo usar la extensión:
En la pantalla de Galaxias de OGame, abre la extensión.

Campos de configuración inicial:
Galaxia inicial y máxima: establece el rango de galaxias a escanear (por defecto 1-5).
Sistema inicial y máximo: establece el rango de sistemas a escanear (por defecto 1-499).
Intervalo de clic (milisegundos): determina la velocidad del escaneo. Si el intervalo es demasiado rápido, podría saltarse planetas.
Probado con intervalos de 1000 ms y 500 ms funcionando correctamente en mi PC.
Botón Scan: inicia el escaneo de los planetas. Solo presiona el botón y deja que el escaneo se ejecute durante 20-40 minutos.

Consejo: ajusta la ventana de Chrome para que sea pequeña pero no la minimices. Mantenla abierta para que el escaneo pueda ejecutarse en segundo plano.

Parar el escaneo:
El escaneo se detendrá automáticamente al completar todas las galaxias y sistemas, o puedes presionar el botón Stop.
Guardar Escaneo: guarda los resultados del escaneo en el almacenamiento local (solo disponible en este PC).
Advertencia: si presionas Stop y Guardar en un escaneo incompleto, el escáner asumirá que esos son los únicos planetas en el universo.
Gestión de Escaneos:

El escáner siempre guarda dos escaneos:
Último Escaneo (Last Scan)
Escaneo Actual (Current Scan)

Cuando presionas Guardar, el escaneo actual se mueve al espacio de Último Escaneo, y el nuevo escaneo que estás guardando se almacena en el espacio de Escaneo Actual.
Esto permite compararlos y verificar cambios en el universo.

Exportar e Importar Escaneos:
Los botones Exportar e Importar te permiten guardar y cargar ambos escaneos como un archivo JSON, con un formato como este:

json
Copy code
{
    "currentScan": {
        "datetime": "YYYY-MM-DD hh:mm",
        "planets": {
            "1.1.1": "player1",
            "1.1.12": "player2",
            ...
        },
        "players": {
            "player1": {
                "alliance": "",
                "planets": [
                    {
                        "coords": "1.75.12",
                        "datetime": "YYYY-MM-DD hh:mm",
                        "name": "Planeta Principal"
                    },
                    {
                        ...
                    },
                    ...
                ]
            },
            "player2": {
                ...
            },
            ...
        }
    },
    "lastScan": {
        ...
    }
}

Tabla de Diferencias de Escaneo:
Una vez que hay dos escaneos almacenados, la tabla Diferencias de Escaneo muestra cada planeta en una fila, con información del jugador y una Alerta si algo relacionado con el planeta cambió desde el último escaneo.
Puedes usar el filtro de texto para buscar un término en cualquiera de los campos de una fila (nombre del planeta, nombre del jugador, etc.) y las casillas de verificación para mostrar únicamente las filas con esas alertas específicas (nuevos planetas, planetas destruidos, cambios de alianza, cambios de nombre del jugador, cambios de nombre del planeta).
