import icons from "./icons.json" with { type: "json" };

const IMG_SIZE = 16;

let css = `i.icon { display: block; height: ${IMG_SIZE}px; width: ${IMG_SIZE}px; }\n`;
css += "table tr { white-space: nowrap; }\n";
css += "td.perms {}\n";
css += "td.file-size { text-align: right; padding-left: 1em; }\n";
css += "td.display-name { padding-left: 1em; }\n";

for (const key of Object.keys(icons)) {
  css += `i.icon-${key} {\n`;
  css += `  background-image: url("data:image/png;base64,${(icons as Record<string, string>)[key]}");\n`;
  css += "}\n\n";
}

export { icons, css };
