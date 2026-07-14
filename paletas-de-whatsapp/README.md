# Paletas para WhatsApp, Kit Digital

Kit digital completo para vender paletas caseras por WhatsApp.

## Contenido

| Archivo | Descripción |
|---------|-------------|
| `produto/Kit_Paletas_de_WhatsApp.pdf` | PDF principal con 30 recetas y guía completa |
| `produto/Calculadora_Precios_Paletas.xlsx` | Calculadora de precios (5 pestañas) |
| `produto/Menu_Editable_Paletas.html` | Menú editable para WhatsApp |
| `produto/Mensajes_para_Vender_Paletas.pdf` | 50+ mensajes listos |
| `produto/Plan_7_Dias_Paletas.pdf` | Plan paso a paso |
| `produto/Checklist_Paletas.pdf` | Checklist imprimible |
| `entrega.html` | Página de descarga para área de miembros |

## Regenerar archivos

```bash
cd paletas-de-whatsapp/build
pip install openpyxl playwright
python -m playwright install chromium
python build.py
```

## Exportar PDF manualmente

Si los PDFs no se generaron automáticamente:
1. Abre cualquier `.html` en Chrome
2. Ctrl+P → Destino: Guardar como PDF
3. Activa "Gráficos de fondo"

## Usar la calculadora

1. Abre `Calculadora_Precios_Paletas.xlsx` en Excel o súbelo a Google Sheets
2. Pestaña **Calculadora**: ingresa ingredientes y costos
3. Pestaña **Ejemplo**: referencia con números ficticios
4. Pestañas **Lista de compras**, **Menú** y **Pedidos**: organiza tu operación

## Área de miembros

Publica `entrega.html` en tu servidor o Vercel. Los enlaces apuntan a `produto/`.

## Editar recetas

Las recetas están en `build/content.py`. Después de editar, ejecuta `python build.py` para regenerar.
