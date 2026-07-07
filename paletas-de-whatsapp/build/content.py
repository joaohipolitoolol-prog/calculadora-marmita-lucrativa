# -*- coding: utf-8 -*-
"""Contenido completo del Kit Paletas para WhatsApp"""

TECNICAS_BASICAS = [
    {
        "titulo": "Cómo insertar los palitos sin que se caigan",
        "pasos": [
            "Vierte la mezcla en los moldes y congela 1 a 2 horas hasta que esté semi-firme (como gelatina).",
            "Haz un pequeño corte con cuchillo en la superficie y coloca el palito.",
            "Cubre con un poco más de mezcla si hace falta y vuelve a congelar 4 horas o toda la noche.",
        ],
    },
    {
        "titulo": "Cómo desmoldar sin romper",
        "pasos": [
            "Sumerge el molde 10–15 segundos en agua tibia (no caliente).",
            "Tira suavemente del palito con movimiento de balanceo.",
            "Si no sale, repite el baño de agua unos segundos más.",
        ],
    },
    {
        "titulo": "Si la paleta queda muy dura o con hielo",
        "pasos": [
            "Frutales: agrega un poco más de azúcar o miel — ayuda a la textura.",
            "Cremosas: sube la proporción de crema o leche condensada.",
            "Licúa bien y cuela para evitar cristales de hielo.",
        ],
    },
]

COMBOS_SUGERIDOS = [
    {"nombre": "Combo refrescante", "contenido": "3 paletas frutales a elegir", "nota": "Ideal para días calurosos. Precio: suma individual menos 10–15%."},
    {"nombre": "Combo familiar", "contenido": "6 paletas surtidas", "nota": "Mezcla frutales + cremosas. Buen ticket promedio."},
    {"nombre": "Combo dulce", "contenido": "1 cremosa + 1 rellena + 1 postre", "nota": "Para quien busca algo más indulgente."},
    {"nombre": "Pack infantil", "contenido": "4 paletas de colores (frutales suaves)", "nota": "Vende bien en vecindarios y grupos familiares."},
]

EJEMPLO_PRECIO = {
    "ingredientes": 4.80,
    "empaque": 1.60,
    "paletas": 8,
    "costo_unitario": 0.80,
    "margen": 40,
    "precio_sugerido": 1.33,
    "nota": "Números ficticios. Tu costo real depende de tu ciudad y proveedores.",
}

CHECKLIST_PRODUCCION = [
    "Revisar pedidos del día y cantidades por sabor",
    "Sacar ingredientes del refrigerador con tiempo",
    "Preparar bases (cremosas y frutales) por separado",
    "Llenar moldes sin rebosar",
    "Insertar palitos cuando la mezcla esté semi-congelada",
    "Etiquetar o separar por cliente si hay pedidos",
    "Verificar empaques limpios y presentables",
    "Calcular hora de entrega según congelación",
    "Enviar mensaje al cliente cuando esté listo",
    "Anotar qué sabores se agotaron para el menú",
]

RECETAS = [
    {
        "num": 1, "nombre": "Paleta de fresa natural", "tipo": "Frutal", "dificultad": "Fácil",
        "prep": "15 min", "congelacion": "4-6 horas", "rendimiento": "8 a 10 paletas",
        "ingredientes": ["2 tazas de fresas frescas", "3 cucharadas de azúcar", "1 cucharada de jugo de limón", "1/2 taza de agua"],
        "pasos": ["Lava y quita el tallo de las fresas.", "Licúa con azúcar, limón y agua hasta obtener una mezcla suave.", "Cuela si quieres textura más fina.", "Vierte en moldes y congela 2 horas.", "Inserta palitos y congela hasta que estén firmes."],
        "consejo": "Sirve en empaque transparente para que se vea el color rojo. Ideal para foto de portada del menú."
    },
    {
        "num": 2, "nombre": "Paleta de mango con limón", "tipo": "Frutal", "dificultad": "Fácil",
        "prep": "12 min", "congelacion": "4-6 horas", "rendimiento": "8 a 10 paletas",
        "ingredientes": ["2 mangos maduros", "2 cucharadas de azúcar", "2 cucharadas de jugo de limón", "1/3 taza de agua"],
        "pasos": ["Pela el mango y corta la pulpa.", "Licúa con azúcar, limón y agua.", "Prueba el dulzor y ajusta.", "Vierte en moldes y congela 1–2 horas.", "Inserta palitos y congela hasta que estén firmes."],
        "consejo": "El contraste mango-limón vende bien como 'sabor tropical'. Ofrece combo de 3 paletas frutales."
    },
    {
        "num": 3, "nombre": "Paleta de piña con hierbabuena", "tipo": "Frutal", "dificultad": "Fácil",
        "prep": "15 min", "congelacion": "4-6 horas", "rendimiento": "8 a 10 paletas",
        "ingredientes": ["2 tazas de piña picada", "1/4 taza de azúcar", "8-10 hojas de hierbabuena fresca", "1/2 taza de agua"],
        "pasos": ["Licúa la piña con azúcar, agua y hierbabuena.", "Cuela para quitar fibras gruesas.", "Vierte en moldes y congela.", "Inserta palitos cuando esté semi-congelada."],
        "consejo": "Menciona 'refrescante' en tu mensaje. Muy vendible en días calurosos."
    },
    {
        "num": 4, "nombre": "Paleta de sandía refrescante", "tipo": "Frutal", "dificultad": "Fácil",
        "prep": "10 min", "congelacion": "4-6 horas", "rendimiento": "10 a 12 paletas",
        "ingredientes": ["3 tazas de sandía sin semillas", "2 cucharadas de azúcar (opcional)", "1 cucharada de limón"],
        "pasos": ["Licúa la sandía con limón.", "Agrega azúcar solo si la fruta no está muy dulce.", "Vierte en moldes y congela 1–2 horas.", "Inserta palitos y congela hasta que estén firmes."],
        "consejo": "Muy económica en temporada. Puedes ofrecer precio especial en verano."
    },
    {
        "num": 5, "nombre": "Paleta de maracuyá", "tipo": "Frutal", "dificultad": "Media",
        "prep": "15 min", "congelacion": "4-6 horas", "rendimiento": "8 paletas",
        "ingredientes": ["1/2 taza de pulpa de maracuyá", "1 taza de agua", "1/3 taza de azúcar", "1 cucharada de miel"],
        "pasos": ["Mezcla pulpa, agua, azúcar y miel.", "Cuela para quitar semillas si prefieres textura suave.", "Vierte en moldes y congela 1–2 horas.", "Inserta palitos y congela hasta que estén firmes."],
        "consejo": "Sabor intenso = puedes posicionarla como opción premium en tu menú.",
    },
    {
        "num": 6, "nombre": "Paleta de frutos rojos", "tipo": "Frutal", "dificultad": "Fácil",
        "prep": "12 min", "congelacion": "4-6 horas", "rendimiento": "8 a 10 paletas",
        "ingredientes": ["1 taza de fresas", "1/2 taza de moras o arándanos", "1/3 taza de azúcar", "1/2 taza de agua", "1 cucharada de limón"],
        "pasos": ["Licúa todos los frutos con azúcar, agua y limón.", "Cuela ligeramente.", "Llena moldes y congela 1–2 horas.", "Inserta palitos y termina de congelar."],
        "consejo": "El color morado/rojo llama mucho la atención en fotos de WhatsApp."
    },
    {
        "num": 7, "nombre": "Paleta de kiwi con limón", "tipo": "Frutal", "dificultad": "Fácil",
        "prep": "12 min", "congelacion": "4-6 horas", "rendimiento": "8 paletas",
        "ingredientes": ["4 kiwis maduros", "3 cucharadas de azúcar", "2 cucharadas de jugo de limón", "1/4 taza de agua"],
        "pasos": ["Pela los kiwis y licúa con azúcar, limón y agua.", "Vierte en moldes.", "Congela 2 horas, inserta palitos y termina de congelar."],
        "consejo": "Color verde vibrante. Perfecta para menú 'infantil/colorido'."
    },
    {
        "num": 8, "nombre": "Paleta cremosa de vainilla", "tipo": "Cremosa", "dificultad": "Fácil",
        "prep": "15 min", "congelacion": "5-7 horas", "rendimiento": "8 a 10 paletas",
        "ingredientes": ["1 taza de leche", "1/2 taza de crema o media crema", "1/3 taza de azúcar", "1 cucharadita de esencia de vainilla"],
        "pasos": ["Mezcla leche, crema, azúcar y vainilla.", "Revuelve hasta disolver el azúcar.", "Vierte en moldes.", "Congela y coloca palitos."],
        "consejo": "Clásica que todos entienden. Buena para combos familiares."
    },
    {
        "num": 9, "nombre": "Paleta de chocolate cremoso", "tipo": "Cremosa", "dificultad": "Fácil",
        "prep": "15 min", "congelacion": "5-7 horas", "rendimiento": "8 a 10 paletas",
        "ingredientes": ["1 taza de leche", "1/2 taza de crema", "3 cucharadas de cacao en polvo", "1/3 taza de azúcar", "1 cucharadita de vainilla"],
        "pasos": ["Licúa leche, crema, cacao, azúcar y vainilla.", "Cuela si queda grumos de cacao.", "Vierte en moldes y congela."],
        "consejo": "Agrega chispas de chocolate encima antes de congelar para más valor visual."
    },
    {
        "num": 10, "nombre": "Paleta de coco", "tipo": "Cremosa", "dificultad": "Fácil",
        "prep": "12 min", "congelacion": "5-7 horas", "rendimiento": "8 paletas",
        "ingredientes": ["1 taza de leche de coco", "1/2 taza de leche", "1/3 taza de azúcar", "2 cucharadas de coco rallado"],
        "pasos": ["Mezcla leche de coco, leche y azúcar.", "Agrega coco rallado.", "Vierte en moldes y congela.", "Espolvorea coco extra encima si quieres."],
        "consejo": "Combina con piña en tu menú como 'pack tropical'."
    },
    {
        "num": 11, "nombre": "Paleta de café suave", "tipo": "Cremosa", "dificultad": "Fácil",
        "prep": "15 min", "congelacion": "5-7 horas", "rendimiento": "8 paletas",
        "ingredientes": ["1 taza de leche", "1/2 taza de crema", "1/2 taza de café preparado y frío", "1/4 taza de azúcar"],
        "pasos": ["Mezcla leche, crema, café frío y azúcar.", "Revuelve bien.", "Vierte en moldes.", "Congela completamente."],
        "consejo": "Apunta a adultos. Buena opción para pedidos de tarde."
    },
    {
        "num": 12, "nombre": "Paleta de banana con leche", "tipo": "Cremosa", "dificultad": "Fácil",
        "prep": "10 min", "congelacion": "5-7 horas", "rendimiento": "8 a 10 paletas",
        "ingredientes": ["2 plátanos maduros", "1 taza de leche", "2 cucharadas de azúcar", "1/2 cucharadita de canela (opcional)"],
        "pasos": ["Licúa plátanos con leche, azúcar y canela.", "Vierte en moldes.", "Congela y coloca palitos."],
        "consejo": "Económica y cremosa. Ideal para empezar con bajo costo."
    },
    {
        "num": 13, "nombre": "Paleta de fresa con crema", "tipo": "Cremosa", "dificultad": "Fácil",
        "prep": "15 min", "congelacion": "5-7 horas", "rendimiento": "8 paletas",
        "ingredientes": ["1 taza de fresas", "1/2 taza de leche", "1/2 taza de crema", "1/3 taza de azúcar"],
        "pasos": ["Licúa fresas con leche, crema y azúcar.", "Vierte en moldes.", "Congela. Opcional: agrega trozos de fresa antes de congelar."],
        "consejo": "Una de las más pedidas. Ponla destacada en tu menú semanal."
    },
    {
        "num": 14, "nombre": "Paleta de dulce de leche", "tipo": "Cremosa", "dificultad": "Media",
        "prep": "15 min", "congelacion": "6-8 horas", "rendimiento": "8 paletas",
        "ingredientes": ["1/2 taza de dulce de leche", "1 taza de leche", "1/2 taza de crema", "1 cucharadita de vainilla"],
        "pasos": ["Mezcla dulce de leche con leche tibia para integrar.", "Agrega crema y vainilla.", "Licúa hasta quedar homogéneo.", "Vierte y congela."],
        "consejo": "Sabor nostálgico muy popular en LATAM. Posiciónala como especial."
    },
    {
        "num": 15, "nombre": "Paleta rellena de chocolate", "tipo": "Rellena", "dificultad": "Media",
        "prep": "25 min", "congelacion": "6-8 horas", "rendimiento": "6 a 8 paletas",
        "ingredientes": ["1 taza de leche", "1/2 taza de crema", "1/4 taza de azúcar", "1/2 taza de chocolate derretido", "Base de paleta: 1 taza de leche + 2 cdas azúcar"],
        "pasos": [
            "Prepara base: mezcla 1 taza de leche con 2 cucharadas de azúcar y vierte en moldes.",
            "Congela 1 hora hasta que esté semi-firme.",
            "Prepara relleno: mezcla crema, chocolate derretido y azúcar.",
            "Con cuchara, haz un hueco en el centro de cada paleta y agrega 1 cucharadita de relleno.",
            "Cubre con más base de leche y congela 4–6 horas. Inserta palitos si aún no lo hiciste.",
        ],
        "consejo": "Corta una paleta para la foto y muestra el relleno. Aumenta valor percibido."
    },
    {
        "num": 16, "nombre": "Paleta rellena de leche condensada", "tipo": "Rellena", "dificultad": "Media",
        "prep": "20 min", "congelacion": "6-8 horas", "rendimiento": "6 a 8 paletas",
        "ingredientes": ["1 taza de leche", "1/4 taza de azúcar", "1/3 taza de leche condensada para relleno", "1/2 taza de crema"],
        "pasos": ["Congela base de leche con azúcar parcialmente.", "Coloca 1 cucharadita de leche condensada en el centro.", "Cubre con mezcla de leche y crema.", "Inserta palito y congela."],
        "consejo": "Muy popular con niños. Ofrece en combo 'pack dulce'."
    },
    {
        "num": 17, "nombre": "Paleta rellena de mermelada de fresa", "tipo": "Rellena", "dificultad": "Media",
        "prep": "20 min", "congelacion": "6-8 horas", "rendimiento": "6 a 8 paletas",
        "ingredientes": ["1 taza de yogur natural", "1/4 taza de azúcar", "1/3 taza de mermelada de fresa", "1/2 taza de leche"],
        "pasos": ["Mezcla yogur, leche y azúcar para la base.", "Congela 1 hora en moldes.", "Agrega mermelada en el centro.", "Cubre con más base y congela."],
        "consejo": "Fácil de armar con mermelada comprada. Buen margen si compras al por mayor."
    },
    {
        "num": 18, "nombre": "Paleta rellena de crema de avellana", "tipo": "Rellena", "dificultad": "Media",
        "prep": "20 min", "congelacion": "6-8 horas", "rendimiento": "6 a 8 paletas",
        "ingredientes": ["1 taza de leche", "1/2 taza de crema", "1/4 taza de azúcar", "3 cucharadas de crema de avellanas o maní"],
        "pasos": ["Prepara base cremosa y congela parcialmente.", "Coloca 1 cucharadita de crema de avellanas en el centro.", "Cubre y congela.", "Opcional: baño de chocolate al final."],
        "consejo": "Sabor premium. Puedes cobrar un poco más que las frutales básicas."
    },
    {
        "num": 19, "nombre": "Paleta rellena de caramelo", "tipo": "Rellena", "dificultad": "Media",
        "prep": "25 min", "congelacion": "6-8 horas", "rendimiento": "6 a 8 paletas",
        "ingredientes": ["1 taza de leche", "1/2 taza de crema", "1/4 taza de azúcar", "3 cucharadas de caramelo o dulce de leche líquido"],
        "pasos": ["Congela base de leche y crema 1 hora.", "Agrega caramelo en el centro con cuidado.", "Cubre con más base.", "Congela hasta firme."],
        "consejo": "Advierte que contiene lácteos. Ideal para clientes que buscan algo indulgente."
    },
    {
        "num": 20, "nombre": "Paleta rellena de mango cremoso", "tipo": "Rellena", "dificultad": "Media",
        "prep": "25 min", "congelacion": "6-8 horas", "rendimiento": "6 a 8 paletas",
        "ingredientes": ["1 mango maduro", "1/2 taza de crema", "1 taza de leche", "1/4 taza de azúcar", "Base: 1/2 taza de yogur + 1/2 taza de leche"],
        "pasos": ["Licúa mango con crema y mitad del azúcar para el relleno.", "Prepara base de yogur y leche.", "Congela base 1 hora, agrega relleno de mango.", "Cubre y congela."],
        "consejo": "Combina lo tropical con lo cremoso. Muy fotogénica."
    },
    {
        "num": 21, "nombre": "Paleta rellena estilo cheesecake", "tipo": "Rellena", "dificultad": "Media",
        "prep": "30 min", "congelacion": "6-8 horas", "rendimiento": "6 a 8 paletas",
        "ingredientes": ["150 g de queso crema", "1/3 taza de azúcar", "1/2 taza de crema", "1 taza de leche", "2 cucharadas de galleta molida"],
        "pasos": ["Mezcla queso crema, azúcar y crema para el relleno.", "Prepara base de leche con galleta molida.", "Congela parcialmente, agrega relleno de cheesecake.", "Cubre y congela."],
        "consejo": "Espolvorea galleta molida encima antes de servir. Se ve muy profesional."
    },
    {
        "num": 22, "nombre": "Paleta de cheesecake de fresa", "tipo": "Estilo postre", "dificultad": "Media",
        "prep": "25 min", "congelacion": "6-8 horas", "rendimiento": "8 paletas",
        "ingredientes": ["150 g de queso crema", "1/2 taza de crema", "1/3 taza de azúcar", "1/2 taza de fresas licuadas", "3 cucharadas de galleta molida"],
        "pasos": ["Licúa queso crema, crema, azúcar y fresas.", "Agrega galleta molida a la mezcla.", "Vierte en moldes.", "Congela. Decora con fresa fresca al servir."],
        "consejo": "Una de las más llamativas del menú. Ponla como 'especial de la semana'."
    },
    {
        "num": 23, "nombre": "Paleta de brownie", "tipo": "Estilo postre", "dificultad": "Media",
        "prep": "30 min", "congelacion": "6-8 horas", "rendimiento": "6 a 8 paletas",
        "ingredientes": ["1 taza de leche", "1/2 taza de crema", "1/4 taza de azúcar", "1/2 taza de brownie en trozos (puedes usar brownie comprado)", "2 cucharadas de cacao"],
        "pasos": ["Mezcla leche, crema, azúcar y cacao.", "Agrega trozos de brownie.", "Vierte en moldes.", "Congela. Los trozos dan textura al morder."],
        "consejo": "Producto estrella para fines de semana. Anuncia con foto de paleta cortada."
    },
    {
        "num": 24, "nombre": "Paleta de galleta y crema", "tipo": "Estilo postre", "dificultad": "Fácil",
        "prep": "15 min", "congelacion": "5-7 horas", "rendimiento": "8 paletas",
        "ingredientes": ["1 taza de leche", "1/2 taza de crema", "1/3 taza de azúcar", "6 galletas tipo vainilla trituradas", "1 cdta de vainilla"],
        "pasos": ["Licúa leche, crema, azúcar, vainilla y la mitad de las galletas.", "Vierte en moldes.", "Agrega trozos de galleta restantes.", "Congela."],
        "consejo": "Muy popular con niños. Usa galletas con diseño para más color."
    },
    {
        "num": 25, "nombre": "Paleta de tiramisú simple", "tipo": "Estilo postre", "dificultad": "Media",
        "prep": "25 min", "congelacion": "6-8 horas", "rendimiento": "6 a 8 paletas",
        "ingredientes": ["1/2 taza de café frío", "1 taza de crema", "150 g de queso crema", "1/4 taza de azúcar", "2 cucharadas de cacao en polvo"],
        "pasos": ["Mezcla queso crema, crema, azúcar y un poco de café.", "Vierte en moldes.", "Espolvorea cacao encima antes de congelar.", "Congela completamente."],
        "consejo": "Posiciónala como opción 'para adultos'. Diferenciador en tu menú."
    },
    {
        "num": 26, "nombre": "Paleta de arroz con leche", "tipo": "Estilo postre", "dificultad": "Media",
        "prep": "35 min", "congelacion": "6-8 horas", "rendimiento": "8 paletas",
        "ingredientes": ["1 taza de arroz cocido", "1 taza de leche", "1/3 taza de azúcar", "1/2 cucharadita de canela", "1 cucharada de pasas (opcional)"],
        "pasos": ["Licúa arroz con leche, azúcar y canela.", "Agrega pasas si usas.", "Vierte en moldes.", "Espolvorea canela encima y congela."],
        "consejo": "Sabor nostálgico. Menciona 'receta de la abuela' en tu mensaje."
    },
    {
        "num": 27, "nombre": "Paleta de chocolate con maní", "tipo": "Estilo postre", "dificultad": "Fácil",
        "prep": "15 min", "congelacion": "5-7 horas", "rendimiento": "8 paletas",
        "ingredientes": ["1 taza de leche", "1/2 taza de crema", "3 cucharadas de cacao", "1/4 taza de azúcar", "3 cucharadas de maní triturado"],
        "pasos": ["Licúa leche, crema, cacao y azúcar.", "Agrega maní triturado.", "Vierte en moldes.", "Congela. Advierte sobre alérgenos."],
        "consejo": "IMPORTANTE: informa que contiene maní. Textura crujiente vende bien."
    },
    {
        "num": 28, "nombre": "Paleta de limón pie", "tipo": "Estilo postre", "dificultad": "Media",
        "prep": "25 min", "congelacion": "6-8 horas", "rendimiento": "8 paletas",
        "ingredientes": ["1/2 taza de jugo de limón", "1 taza de leche condensada", "1 taza de crema", "3 cucharadas de galleta molida", "Ralladura de limón"],
        "pasos": ["Mezcla jugo de limón, leche condensada y crema.", "Agrega ralladura de limón.", "Vierte en moldes con galleta en el fondo.", "Congela."],
        "consejo": "Sabor ácido-dulce equilibrado. Muy refrescante y diferente."
    },
    {
        "num": 29, "nombre": "Paleta de yogur con granola", "tipo": "Estilo postre", "dificultad": "Fácil",
        "prep": "12 min", "congelacion": "5-7 horas", "rendimiento": "8 paletas",
        "ingredientes": ["1 1/2 tazas de yogur natural", "1/4 taza de miel", "1/2 taza de granola", "1/2 taza de frutos rojos picados"],
        "pasos": ["Mezcla yogur con miel.", "Agrega granola y frutos.", "Vierte en moldes.", "Congela. Agrega granola extra al servir."],
        "consejo": "Opción 'más ligera' para clientes que lo piden. Buena para historias de WhatsApp."
    },
    {
        "num": 30, "nombre": "Paleta tropical premium", "tipo": "Estilo postre", "dificultad": "Media",
        "prep": "30 min", "congelacion": "6-8 horas", "rendimiento": "6 a 8 paletas",
        "ingredientes": ["1/2 taza de mango", "1/2 taza de piña", "1/2 taza de maracuyá", "1/2 taza de crema", "1/4 taza de azúcar", "1 cucharada de coco rallado"],
        "pasos": ["Licúa cada fruta por separado.", "Vierte capas de mango, piña y maracuyá en el molde.", "Agrega crema con coco entre capas.", "Congela. El efecto de capas es muy visual."],
        "consejo": "Tu producto estrella visual. Cobra más y úsala como imagen principal del menú."
    },
]

COMBINACIONES = [
    {"nombre": "Fresa con leche condensada", "porque": "Clásico dulce que todos reconocen. Muy fotogénico."},
    {"nombre": "Mango con chile suave", "porque": "Toque mexicano/LATAM que llama la atención en el menú."},
    {"nombre": "Chocolate con galleta", "porque": "Textura crujiente. Muy pedido por niños."},
    {"nombre": "Coco con piña", "porque": "Nombre 'tropical' vende bien en combos."},
    {"nombre": "Maracuyá cremoso", "porque": "Sabor intenso = puedes cobrar un poco más."},
    {"nombre": "Cheesecake de fresa", "porque": "Se ve premium sin ser complicado."},
    {"nombre": "Limón pie", "porque": "Ácido y refrescante. Diferente a lo común."},
    {"nombre": "Brownie chocolate", "porque": "Ideal para anunciar fines de semana."},
    {"nombre": "Dulce de leche", "porque": "Nostálgico y popular en toda LATAM."},
    {"nombre": "Yogur con frutos rojos", "porque": "Opción 'más ligera' para algunos clientes."},
    {"nombre": "Café con leche", "porque": "Atrae adultos. Buena para tarde."},
    {"nombre": "Banana con canela", "porque": "Barata de producir. Buen margen."},
    {"nombre": "Sandía con menta", "porque": "Muy refrescante en verano."},
    {"nombre": "Vainilla con chispas", "porque": "Colorida y fácil de vender a familias."},
    {"nombre": "Tres capas tropicales", "porque": "Visual impactante para foto de portada."},
]

MENSAJES = {
    "menu": [
        "🍓 ¡Hola! Esta semana tengo paletas caseras listas. Sabores disponibles: [sabores]. Si quieres reservar, escríbeme por aquí.",
        "Menú de paletas de la semana 👇 Cremosas, frutales y rellenas. Pregunta por precios y disponibilidad.",
        "Preparé paletas frescas hoy. Te comparto el menú con sabores y precios. ¿Cuál te llama la atención?",
        "Paletas hechas en casa, con ingredientes que puedes conocer. Menú actualizado: [sabores]. Pedidos por WhatsApp.",
        "¿Antojo de algo fresco? Tengo paletas disponibles para entrega hoy. Escríbeme y te mando el menú completo.",
        "Nueva tanda de paletas lista 🍦 Sabores: [sabores]. Cantidad limitada según lo que preparé hoy.",
        "Paletas caseras para este fin de semana. Menú: [sabores]. Puedes apartar las tuyas con anticipación.",
        "Si buscas un dulce fresco, tengo paletas artesanales. Te paso el menú con precios por unidad y combos.",
        "Hoy hornée... digo, congelé paletas 😊 Disponibles: [sabores]. ¿Te aparto alguna?",
        "Menú dulce de la semana: paletas caseras en sabores [sabores]. Entrega en [zona] o recogida.",
    ],
    "status": [
        "🍓 Paletas listas. Escríbeme si quieres el menú.",
        "Algo fresco para hoy 🍦",
        "Nuevos sabores esta semana",
        "Paletas caseras — pregunta por disponibilidad",
        "¿Paleta de qué sabor te provoca?",
        "Hechas hoy, disponibles hasta agotar stock",
        "Dulce, fresco y hecho en casa",
        "Menú de paletas en mi estado anterior 👆",
        "Pregunta por combos familiares",
        "Ideal para el calor ☀️🍓",
    ],
    "promo": [
        "Promo fin de semana: 3 paletas surtidas por [precio]. Válido sábado y domingo.",
        "Combo familiar: 6 paletas a elegir por [precio]. Perfecto para compartir.",
        "Este sábado: lleva 2 paletas y la tercera con descuento. Pregunta por sabores.",
        "Pack refrescante: 4 paletas frutales por [precio]. Solo este fin de semana.",
        "Promo para vecinos: 10% de descuento en tu primer pedido. Escríbeme.",
        "Últimas paletas del día con precio especial. Disponibles hasta agotar.",
        "Combo dulce: 1 cremosa + 1 frutal + 1 rellena por [precio].",
        "Promo de fin de semana: si apartas hoy, te guardo las paletas para mañana sin costo extra.",
        "Fin de semana dulce 🍓 Pedidos con anticipación tienen prioridad.",
        "Si te animas este fin de semana, tengo combo surtido. Escríbeme y te paso opciones.",
    ],
    "clientes": [
        "¡Hola de nuevo! 😊 Esta semana tengo sabores nuevos. ¿Te mando el menú actualizado?",
        "Hace tiempo que no pides. Tengo tus sabores favoritos disponibles hoy.",
        "Gracias por tu pedido anterior. Esta semana preparé [sabor nuevo] — ¿quieres probarlo?",
        "Para clientes frecuentes: aviso anticipado de la tanda del fin de semana.",
        "¿Te gustó la última paleta? Esta semana repetí ese sabor y agregué uno nuevo.",
        "Hola, ¿cómo estás? Tengo paletas listas y pensé en ti. ¿Te interesa el menú?",
        "Pedido especial para ti: puedo preparar tu sabor favorito si me avisas con 24h.",
        "Gracias por recomendarme. Si traes un amigo, ambos tienen descuento en combo.",
        "Tu sabor [favorito] está en el menú de esta semana. ¿Te aparto?",
        "Clientes de siempre: escríbeme 'cliente' y te mando precios especiales.",
    ],
    "ultimas": [
        "Quedan pocas paletas de [sabor]. Si quieres, aparto las tuyas ahora.",
        "Últimas 5 unidades del día. Escríbeme antes de que se acaben.",
        "Casi agotado el stock de hoy. ¿Te guardo alguna?",
        "Solo me quedan paletas de [sabores]. Mañana preparo nueva tanda.",
        "Stock limitado — lo que ves es lo que hay. Pregunta por disponibilidad.",
    ],
    "pedidos": [
        "Perfecto, tu pedido: [sabores] x [cantidad] — Total: [precio]. ¿Confirmo?",
        "Listo, aparté tus paletas. Te aviso cuando estén listas para entrega.",
        "Tu pedido está confirmado ✅ Te escribo cuando salga para [dirección/zona].",
        "Recibido. Prepararé [cantidad] paletas de [sabores]. ¿Pagas al recoger o transferencia?",
        "Pedido anotado. Hora estimada de entrega: [hora]. Cualquier cambio, avísame.",
    ],
    "faq": [
        "¡Hola! Sí, tengo paletas disponibles hoy. Te comparto el menú con sabores y precios 👇",
        "El precio por paleta es [precio]. También tengo combos si quieres llevar varias.",
        "Entrego en [zona] o puedes recoger en [punto]. ¿Qué te queda mejor?",
        "Puedes pagar por transferencia o en efectivo al recoger. ¿Cómo prefieres?",
        "Sí, acepto pedidos con 24 horas de anticipación. ¿Para qué día lo necesitas?",
        "Esta paleta contiene [leche/maní/gluten]. ¿Tienes alguna alergia que deba saber?",
        "Las paletas se conservan en congelador. Te recomiendo consumirlas el mismo día o al día siguiente.",
        "El combo de 3 paletas sale en [precio]. Puedes elegir los sabores disponibles.",
        "Por ahora manejo pedidos pequeños desde casa. Si necesitas cantidad para evento, escríbeme y vemos.",
        "¡Gracias por tu interés! Si quieres, te mando foto del menú de hoy.",
    ],
}

ALERGENOS_RECETA = {
    8: "Lácteos", 9: "Lácteos", 10: "Lácteos", 11: "Lácteos", 12: "Lácteos",
    13: "Lácteos", 14: "Lácteos", 15: "Lácteos", 16: "Lácteos", 17: "Lácteos",
    18: "Lácteos, frutos secos (avellana/maní)", 19: "Lácteos", 20: "Lácteos",
    21: "Lácteos, gluten (galleta)", 22: "Lácteos, gluten", 23: "Lácteos, gluten, huevo (brownie)",
    24: "Lácteos, gluten", 25: "Lácteos", 26: "Lácteos", 27: "Lácteos, maní",
    28: "Lácteos, gluten", 29: "Lácteos, gluten (granola)", 30: "Lácteos",
}

PLAN_7_DIAS = [
    {"dia": 1, "titulo": "Elige tus primeras recetas", "duracion": "30–45 min", "meta": "Tener 3 a 5 sabores definidos y lista de compras", "tareas": ["Revisa las 30 recetas del kit", "Elige 3 a 5 sabores para empezar (1 frutal, 1 cremosa, 1 rellena)", "Anota los ingredientes en la lista de compras de la calculadora"]},
    {"dia": 2, "titulo": "Calcula tus costos", "duracion": "20–30 min", "meta": "Saber cuánto te cuesta cada paleta y a qué precio vender", "tareas": ["Abre la Calculadora de Precios", "Ingresa el costo real de cada ingrediente en tu ciudad", "Define tu margen y anota el precio sugerido por paleta"]},
    {"dia": 3, "titulo": "Prepara una pequeña tanda", "duracion": "1–2 horas + congelación", "meta": "Probar que la receta sale bien antes de vender", "tareas": ["Produce solo 6-10 paletas como prueba", "Prueba textura y dulzor", "Ajusta la receta si es necesario antes de producir más"]},
    {"dia": 4, "titulo": "Toma fotos y arma tu menú", "duracion": "45–60 min", "meta": "Tener menú y foto listos para publicar", "tareas": ["Fotografía con luz natural y fondo limpio", "Completa el menú editable con sabores y precios", "Prepara imagen o texto para publicar en WhatsApp"]},
    {"dia": 5, "titulo": "Publica en WhatsApp", "duracion": "20–30 min", "meta": "Que al menos 10 personas vean tu oferta", "tareas": ["Publica tu menú en estado o historia", "Usa uno de los mensajes listos del kit", "Comparte con amigos, familia y vecinos con educación"]},
    {"dia": 6, "titulo": "Organiza pedidos", "duracion": "Según demanda", "meta": "Responder con claridad y anotar cada pedido", "tareas": ["Anota cada pedido en la pestaña Pedidos de la calculadora", "Confirma sabores, cantidad y forma de pago", "Organiza entrega o punto de recogida"]},
    {"dia": 7, "titulo": "Ajusta sabores y precios", "duracion": "30 min", "meta": "Planificar la semana 2 con datos reales", "tareas": ["Revisa qué sabores preguntaron más", "Ajusta precios si algún ingrediente subió", "Planifica la tanda de la próxima semana"]},
]

CHECKLIST_VENTA = [
    "Elegir 3 a 5 sabores para empezar",
    "Comprar ingredientes y materiales",
    "Calcular costos con la calculadora",
    "Definir precios con margen estimado",
    "Armar mi menú para WhatsApp",
    "Tomar fotos con buena luz",
    "Publicar en estado o historia",
    "Tener mensajes listos para responder",
    "Anotar pedidos de forma organizada",
    "Organizar entrega o recogida",
    "Informar alérgenos cuando corresponde",
    "Pedir feedback a quien prueba",
]

ERRORES_COMUNES = [
    "Cobrar sin calcular los costos reales",
    "Empezar con demasiados sabores a la vez",
    "No anotar pedidos y olvidar detalles",
    "Usar fotos oscuras o desordenadas",
    "No informar sabores claramente en el menú",
    "Olvidar incluir empaque y palito en el costo",
    "Producir mucho antes de probar la receta",
    "No avisar sobre leche, maní, nueces u otros alérgenos",
    "Mezclar el dinero de ventas con el de ingredientes",
    "No pedir opinión a los primeros clientes",
]

FOTOS_TIPS = [
    "Usa luz natural cerca de una ventana",
    "Fondo limpio: mesa clara o tabla de madera",
    "Muestra la textura: paleta mordida o cortada",
    "Incluye el empaque si lo usas",
    "Toma la foto en vertical (formato celular)",
    "Evita fotos oscuras o con flash fuerte",
    "No escondas el producto con demasiados elementos",
    "Una paleta bien iluminada vende más que diez fotos malas",
]
