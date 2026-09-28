# Uncle Bear Studios

Independent studio website for https://unclebearstudios.com.

This is a standalone static website: no framework, dependencies, build step, or JavaScript required. Content and navigation remain available if scripting is disabled. The original supplied logo is preserved in assets/.

## Publish with GitHub Pages

1. Create a GitHub repository named `UncleBearStudios-Website` in the intended account.
2. Upload all files in this directory to the repository root, including `.github`, `.nojekyll`, and `CNAME`. Do not upload an extra enclosing folder.
3. In Settings → Pages, choose Deploy from a branch, `main`, and `/ (root)`.
4. Set the custom domain to `unclebearstudios.com`. Configure the domain's DNS for GitHub Pages using GitHub's current documentation. A CNAME file alone does not configure DNS.
5. Once the certificate is available, enable Enforce HTTPS. Verify both the apex domain and any desired www redirect.

GitHub Pages custom-domain documentation: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site

## Content maintenance

- `index.html`: studio mission, game preview, founder story, contact details.
- `styles.css`: responsive styles, visible keyboard focus, reduced-motion support.
- `assets/uncle-bear-studios-logo.png`: supplied studio logo, unchanged.
- `robots.txt`, `sitemap.xml`, `CNAME`: production domain configuration.
- `.github/workflows/validate.yml`: dependency-free local-link and document checks on pushes and pull requests.

The v2.1.2 preview URL and contact email were carried over from the Sweitzer Ventures website. Confirm the Google Drive file is publicly downloadable and is still the intended preview before launch. The game itself is not included in this repository.

Accessibility is described as a studio goal, not a claim that the preview game meets a particular standard. The founder story is written in first person based on Brandon's supplied account.

## Review before launch

Check the site at desktop and mobile widths, navigate every link with a keyboard, download the game while signed out of Google, and confirm domain ownership, DNS, and HTTPS settings. The included checks do not replace browser or accessibility testing.
