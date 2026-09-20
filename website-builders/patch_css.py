import re

css_path = r"c:\Users\venun\Desktop\Website-Builders\website-builders\css\messages.css"

with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Variables mapping
mapping = {
    "--surface": "--msg-surface",
    "--background": "--msg-background",
    "--primary": "--msg-primary",
    "--border": "--msg-border",
    "--text-main": "--msg-text-main",
    "--text-muted": "--msg-text-muted",
    "--secondary": "--msg-secondary",
    "--accent": "--msg-accent",
    "--danger": "--msg-danger"
}

for old_var, new_var in mapping.items():
    css = css.replace(f"var({old_var})", f"var({new_var})")

root_block = """
:root {
  --msg-primary: var(--primary, var(--primary-teal, var(--primary-green, #0F766E)));
  --msg-surface: var(--bg-card, var(--card-bg, #FFFFFF));
  --msg-background: var(--bg-page, var(--page-bg, #F5F7F6));
  --msg-border: var(--border, var(--border-color, #DCE5E2));
  --msg-text-main: var(--text-main, var(--main-text, #17211F));
  --msg-text-muted: var(--text-secondary, var(--secondary-text, var(--muted-text, #64706C)));
  --msg-secondary: var(--text-secondary, var(--secondary-text, #64706C));
  --msg-accent: var(--accent, var(--warning, #F59E0B));
  --msg-danger: var(--danger, #DC2626);
}

"""

if ":root {" not in css:
    css = root_block + css

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

print("messages.css patched successfully!")
