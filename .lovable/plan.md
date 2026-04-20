

## Plano: Instalar Google Tag Manager (GTM-WC8JWRR4)

### Objetivo
Adicionar o snippet do Google Tag Manager globalmente na aplicação, conforme instruções do usuário, sem afetar outros recursos.

### Alterações no index.html

**1. Adicionar script GTM no `<head>` (após a linha 31, antes de `</head>`):**

```html
<!-- Google Tag Manager -->
<script>
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WC8JWRR4');
</script>
<!-- End Google Tag Manager -->
```

**2. Adicionar noscript iframe logo após `<body>` (após a linha 34, antes de `<div id="root">`):**

```html
<!-- Google Tag Manager (noscript) -->
<noscript>
<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WC8JWRR4"
height="0" width="0" style="display:none;visibility:hidden"></iframe>
</noscript>
<!-- End Google Tag Manager (noscript) -->
```

### Arquivo modificado
- `index.html`

### Validação pós-instalação
Após a publicação, o usuário deve verificar:
1. **Network tab**: filtrar por `googletagmanager` e confirmar carregamento de `gtm.js?id=GTM-WC8JWRR4`
2. **Console**: digitar `dataLayer` e confirmar que retorna um array (não erro)
3. Tag Assistant (extensão do Chrome): confirmar que o container GTM está carregando

