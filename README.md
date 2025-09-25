# gPassword & Encoder Tools

[![Visual Studio Marketplace](https://img.shields.io/vscode-marketplace/i/ddniel16.gpassword.svg)](https://marketplace.visualstudio.com/items?itemName=ddniel16.gpassword)

## Instalación

Con Visual Studio Code abierto, lanza la búsqueda rápida (Ctrl+P), pega el siguiente comando y presiona enter.

> ext install ddniel16.gpassword

Alternativamente, instala manualmente el VSIX desde la [última versión](https://github.com/ddniel16/vscode-gPassword/releases/latest) y luego instálalo desde el menú de extensiones (Ctrl+Shift+X) - (tres puntos en la esquina superior derecha) > "Instalar desde VSIX...".

o con desde la terminal:

```bash
code --install-extension <path-to-file>.vsix
```

## ¿Qué es gPassword & Encoder Tools?

**gPassword & Encoder Tools** es una extensión "**vsix**" que te ayuda a generar contraseñas seguras y realizar tareas comunes de codificación y decodificación, todo desde tu editor.

Esta extensión combina varias herramientas útiles para desarrolladores, como la generación de contraseñas, codificación y decodificación Base64, decodificación JWT y más, todo en un solo lugar. Con comandos accesibles y acceso desde el submenu, puedes mejorar tu flujo de trabajo y añadir seguridad a tus proyectos, sin salir de tu editor.

## ¿Qué puedes hacer con esta extensión?

- Generar contraseñas seguras:
  - Solo letras
  - Letras y números
  - Letras, números y símbolos
- Convertir contraseñas a hash de Basic Auth (`bcrypt.hashSync`)
- Codificar y decodificar en Base64
- Generar salts para WordPress (formato Env o Yaml)
- Generar tokens para Strapi (formato Env o Yaml)
- Decodificar JWT

## ¿Cómo usarla?

1. **Abre la paleta de comandos** (`Ctrl+Shift+P` o `Cmd+Shift+P`).
2. **Busca "gPassword"** para ver todos los comandos disponibles.
3. **Selecciona el comando**

![commands](https://raw.githubusercontent.com/ddniel16/vscode-gPassword/main/imgs/commands.png)

## Submenú de gPassword

Puedes acceder a un submenú con todas las opciones de gPassword haciendo clic derecho en el editor. Esto te permite acceder rápidamente a las funciones más utilizadas sin necesidad de recordar los comandos.

![submenu](https://raw.githubusercontent.com/ddniel16/vscode-gPassword/main/imgs/submenu.png)

## Personaliza la generación de contraseñas

Por defecto, las contraseñas se generan con una longitud aleatoria entre 20 y 25 caracteres. Puedes cambiar esto en la configuración de la extensión:

- `gpassword.randomLengthMin`: Mínimo de caracteres (entre 15 y 54)
- `gpassword.randomLengthMax`: Máximo de caracteres (entre 16 y 55)

![settings](https://raw.githubusercontent.com/ddniel16/vscode-gPassword/main/imgs/settings.png)

> Si el valor mínimo es mayor que el máximo, aparecerá un error controlado.

## ¡Comienza ahora!

Explora los comandos y configura la extensión a tu gusto para mejorar tu seguridad y productividad.

**¡Disfruta usando gPassword & Encoder Tools!**
