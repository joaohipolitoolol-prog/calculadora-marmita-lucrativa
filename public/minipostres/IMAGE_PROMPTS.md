# Mini Postres: prompts de imagen

Usar para generar fotos reales (Midjourney, Flux, Ideogram, etc.). Sustituir los SVG placeholder en `/public/minipostres/`.

## Prompt base de fotografía

```
Realistic premium food photography of an individual cold dessert in a small transparent container, visible creamy layers, homemade but professional presentation, Latin American dessert aesthetic, natural ingredients, soft warm lighting, clean neutral background (#FFF8F2 / soft beige), realistic texture, appetizing but not artificial, high detail, no text, no logos, no hands with deformities, vertical composition, 4:5
```

## 1. Hero: composición

```
Overhead and slight 3/4 angle composition of 8 mini cold desserts in individual transparent cups on a cream surface, visible creamy layers: strawberry, chocolate, Oreo crumbs, lemon zest, dulce de leche drizzle, passion fruit pulp, coconut flakes; homemade premium Latin American aesthetic, soft warm window light, no text, no logos, appetizing realistic food photography, wide 3:2
```

## 2. Tarta alemana individual

```
{BASE} of individual German-style layered cold cake (tarta alemana) in a small clear cup: chocolate sponge-style crumbs (no oven look, cookie crumb texture), cream layers, chocolate shavings on top
```

## 3. Fresa cremosa

```
{BASE} strawberry creamy mini dessert: white cream base, pink strawberry mousse mid-layer, fresh strawberry pieces and a glazed strawberry on top
```

## 4. Limón

```
{BASE} lemon cold mini dessert: pale yellow creamy layers, cookie base crumbs, lemon zest curls, light and fresh look
```

## 5. Oreo

```
{BASE} Oreo-inspired cold mini dessert: dark cookie crumb base, white cream, crushed Oreo-like cookies on top (generic cookies, no brand logos)
```

## 6. Chocolate

```
{BASE} rich chocolate cold mini dessert: dark chocolate cream layers, cocoa dusting, chocolate curls, indulgent but realistic
```

## 7. Maracuyá

```
{BASE} passion fruit (maracuyá) cold mini dessert: creamy white base, yellow passion fruit gelé mid-layer, passion fruit pulp and seeds on top
```

## 8. Dulce de leche

```
{BASE} dulce de leche cold mini dessert: caramel-colored cream layers, caramel drizzle, soft cookie crumbs
```

## 9. Coco

```
{BASE} coconut cold mini dessert: white creamy layers, toasted coconut flakes on top, tropical soft look
```

## 10. Café

```
{BASE} coffee-flavored cold mini dessert: mocha-toned cream, light cookie base, cocoa dusting, adult dessert aesthetic
```

## 11. Tres leches

```
{BASE} individual cold tres leches-style dessert in a clear cup: soaked sponge-like crumbs (cookie/cake crumbs), milky cream, cinnamon dust optional, juicy but neat
```

## 12. Banoffee

```
{BASE} banoffee mini dessert: dulce de leche layer, sliced banana, whipped cream top, cookie crumbs
```

## 13. Cheesecake frío

```
{BASE} no-bake cheesecake mini cup: cookie crumb base, thick cream cheese layer, berry sauce swirl on top
```

## 14. Mockup del producto

```
Clean product mockup scene: smartphone showing a dessert webapp menu, printed PDF booklet, shopping list paper, WhatsApp catalog print, cost calculator sheet, soft cream background, soft shadows, premium feminine without being childish, no fake brand logos, 4:3
```

## 15. Lista de compras

```
Flat lay of grocery list paper with handwritten Spanish categories (lácteos, frutas, galletas), small bowls of cream, strawberries, cookies, dulce de leche jar, warm kitchen light, cream background, no logos
```

## 16. Catálogo

```
Phone mockup showing a WhatsApp-style dessert catalog with mini dessert thumbnails in clear cups, soft cream UI, Latin American food business aesthetic, no real chat with personal data, no fake testimonials
```

## 17. Calculadora de costos

```
Tablet or phone screen showing a simple cost calculator UI for desserts (ingredientes, empaque, rendimiento, precio sugerido), cream and strawberry pink accents (#D94F70), clean modern UI, no tiny illegible text
```

## 18. Tela mobile

```
Realistic hand-free smartphone mockup displaying Mini Postres member area with recipe cards, cream background, soft shadow, premium lifestyle product shot
```

## 19. VSL poster

```
{BASE} collage-like single frame of several mini cold desserts (strawberry, chocolate, Oreo, German cake style), centered subtle play button overlay space, text-safe center, cream background, 16:9, leave empty center for play icon, NO text rendered in image
```

## 20. Oferta final

```
Elegant dark chocolate (#4A2B25) and cream product offer photography: mini desserts arranged near a closed digital tablet, soft rim light, premium trustworthy mood, no money stacks, no fake certificates
```

## Notas

- Preferir **WebP** exportado a ~1200px ancho máx. para sabores; hero ~1600px.
- No usar texto generado por IA en la imagen.
- No mostrar manos deformes.
- Sustituir archivos SVG actuales manteniendo el mismo nombre de archivo cuando sea posible (o actualizar rutas en `src/minipostres/config.js`).
