export const htmlTemplate =
  `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0.2/css/bulma.min.css">
      </head>
      <body>
        <section class="section has-text-dark">
            {{content}}
        </section>
      </body>
      <style>
        body {
          font-family: 'Times New Roman', Times, serif;
        }

        .page {
            break-after: page;
        }
      </style>
    </html>
  `;
