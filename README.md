# gPassword & Encoder Tools

[![Visual Studio Marketplace](https://img.shields.io/vscode-marketplace/i/ddniel16.gpassword.svg)](https://marketplace.visualstudio.com/items?itemName=ddniel16.gpassword)

```vscode
ext install ddniel16.gpassword
```

Generator password & Encoder Tools is a one-stop solution for strong password generation and encoding tools.

## Features

Passwords can currently be generated:

- Letters only
- Letters and numbers
- Letters, Numbers & Symbols
- Replace password to hash of Basic Auth (bcrypt.hashSync)
- Base64 encode
- Base64 decode
- WordPress Salt Env|Yaml
- JWT decode

![commands](https://raw.githubusercontent.com/ddniel16/vscode-gPassword/main/imgs/commands.png)

## Settings

By default, passwords are generated with a random size between 20 and 25 characters, but it can be changed in the settings:

- `gpassword.randomLengthMin`: Between 15 and 54
- `gpassword.randomLengthMax`: Between 16 and 55

![settings](https://raw.githubusercontent.com/ddniel16/vscode-gPassword/main/imgs/settings.png)

> If the minimum value is defined greater than the maximum value, a controlled error will occur.

**Enjoy!**
