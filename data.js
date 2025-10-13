// Datos locales de prueba (se usan si no configuras GAS_URL o si falla la carga)
const LOCAL_ZONAS = [
  { zona_id: "3-1", zona_nombre: "Zona 3-1" },
  { zona_id: "3-2", zona_nombre: "Zona 3-2" }
];

const LOCAL_CONTRATOS = [
  { contrato_id: "2022CD-00145-0006000001", zona_id: "3-1", descripcion: "Contrato zona 3-1" },
  { contrato_id: "2022CD-000145-0006000001", zona_id: "3-2", descripcion: "Contrato zona 3-2" },
  { contrato_id: "2022CD-000149-0006000001", zona_id: "ambas", descripcion: "Ambas zonas" }
];

// Rutas de ejemplo por zona
const LOCAL_RUTAS = {
  "3-1": [
    { ruta_codigo: "1", ruta_nombre: "1" },
    { ruta_codigo: "17", ruta_nombre: "17" },
    { ruta_codigo: "23", ruta_nombre: "23" },
    { ruta_codigo: "131", ruta_nombre: "131" },
    { ruta_codigo: "132", ruta_nombre: "132" },
    { ruta_codigo: "144", ruta_nombre: "144" },
    { ruta_codigo: "603", ruta_nombre: "603" },
    { ruta_codigo: "604", ruta_nombre: "604" },
    { ruta_codigo: "605", ruta_nombre: "605" },
    { ruta_codigo: "606", ruta_nombre: "606" },
    { ruta_codigo: "615", ruta_nombre: "615" },
    { ruta_codigo: "619", ruta_nombre: "619" },
    { ruta_codigo: "620", ruta_nombre: "620" },
    { ruta_codigo: "622", ruta_nombre: "622" },
    { ruta_codigo: "742", ruta_nombre: "742" },
    { ruta_codigo: "755", ruta_nombre: "755" },
    { ruta_codigo: "756", ruta_nombre: "756" },
    { ruta_codigo: "60101", ruta_nombre: "60101" }
  ],
  "3-2": [
    { ruta_codigo: "3", ruta_nombre: "3" },
    { ruta_codigo: "34", ruta_nombre: "34" },
    { ruta_codigo: "131", ruta_nombre: "131" },
    { ruta_codigo: "137", ruta_nombre: "137" },
    { ruta_codigo: "235", ruta_nombre: "235" },
    { ruta_codigo: "239", ruta_nombre: "239" },
    { ruta_codigo: "301", ruta_nombre: "301" },
    { ruta_codigo: "318", ruta_nombre: "318" },
    { ruta_codigo: "320", ruta_nombre: "320" },
    { ruta_codigo: "607", ruta_nombre: "607" },
    { ruta_codigo: "609", ruta_nombre: "609" },
    { ruta_codigo: "616", ruta_nombre: "616" },
    { ruta_codigo: "618", ruta_nombre: "618" },
    { ruta_codigo: "713", ruta_nombre: "713" },
    { ruta_codigo: "755", ruta_nombre: "755" },
    { ruta_codigo: "757", ruta_nombre: "757" }
  ]
};

// Secciones de ejemplo por clave "zona:ruta"
const LOCAL_SECCIONES = {
  "3-1:1": [
    { seccion_control: "20060" },
    { seccion_control: "60200" },
    { seccion_control: "60210" },
    { seccion_control: "60220" },
    { seccion_control: "60230" },
    { seccion_control: "60240" }
  ],
  "3-1:17": [
    { seccion_control: "60190" },
    { seccion_control: "60621" },
    { seccion_control: "60622" },
    { seccion_control: "60623" }
  ],
  "3-1:23": [
    { seccion_control: "60610" },
    { seccion_control: "60840" }
  ],
  "3-1:131": [
    { seccion_control: "60560" }
  ],
  "3-1:132": [
    { seccion_control: "60730" }
  ],
  "3-1:144": [
    { seccion_control: "60630" }
  ],
  "3-1:603": [
    { seccion_control: "60720" }
  ],
  "3-1:604": [
    { seccion_control: "60560" },
    { seccion_control: "60660" },
    { seccion_control: "60830" }
  ],
  "3-1:605": [
    { seccion_control: "60691" },
    { seccion_control: "60692" }
  ],
  "3-1:606": [
    { seccion_control: "60671" },
    { seccion_control: "60672" },
    { seccion_control: "60681" },
    { seccion_control: "60682" },
    { seccion_control: "60700" },
    { seccion_control: "60710" }
  ],
  "3-1:615": [
    { seccion_control: "60641" },
    { seccion_control: "60642" }
  ],
  "3-1:619": [
    { seccion_control: "60070" }
  ],
  "3-1:620": [
    { seccion_control: "60151" },
    { seccion_control: "60152" }
  ],
  "3-1:622": [
    { seccion_control: "60440" },
    { seccion_control: "60450" }
  ],
  "3-1:742": [
    { seccion_control: "60601" },
    { seccion_control: "60602" }
  ],
  "3-1:755": [
    { seccion_control: "60470" }
  ],
  "3-1:756": [
    { seccion_control: "60571" },
    { seccion_control: "60572" }
  ],
  "3-1:60101": [
    { seccion_control: "69000" }
  ],
  "3-2:3": [
    { seccion_control: "20111" },
    { seccion_control: "20112" },
    { seccion_control: "20700" }
  ],
  "3-2:34": [
    { seccion_control: "21300" },
    { seccion_control: "60170" },
    { seccion_control: "60162" },
    { seccion_control: "60161" },
    { seccion_control: "60140" },
    { seccion_control: "60082" },
    { seccion_control: "60081" },
    { seccion_control: "60120" },
    { seccion_control: "60113" },
    { seccion_control: "60112" },
    { seccion_control: "60111" },
  ],
  "3-2:131": [
    { seccion_control: "20120" }
  ],
  "3-2:137": [
    { seccion_control: "21290" }
  ],
  "3-2:235": [
    { seccion_control: "60461" },
    { seccion_control: "60462" }
  ],
  "3-2:239": [
    { seccion_control: "60540" }
  ],
  "3-2:301": [
    { seccion_control: "60591" },
    { seccion_control: "60592" }
  ],
  "3-2:318": [
    { seccion_control: "60510" }
  ],
  "3-2:320": [
    { seccion_control: "60550" }
  ],
  "3-2:607": [
    { seccion_control: "60500" }
  ],
  "3-2:609": [
    { seccion_control: "60531" },
    { seccion_control: "60532" }
  ],
  "3-2:616": [
    { seccion_control: "60580" }
  ],
  "3-2:618": [
    { seccion_control: "60130" }
  ],
  "3-2:713": [
    { seccion_control: "21690" }
  ],
  "3-2:755": [
    { seccion_control: "20271" },
    { seccion_control: "20272" }
  ],
  "3-2:757": [
    { seccion_control: "20711" },
    { seccion_control: "20712" }
  ]
};

// Items de prueba por contrato
const LOCAL_ITEMS = {
  "2022CD-000145-0006000001::3-1": [
    {
      item_codigo: "CR.602.01 (P-24\")",
      item_nombre: "Tubería PEAD corrugada, doble pared de 24\" de diámetro (DCVP-32-2024-0188)"
    },
    {
      item_codigo: "CR.602.01 (P-36\")",
      item_nombre: "Tubería PEAD corrugada, doble pared de 36\" de diámetro (DCVP-32-2024-0188)"
    },
    {
      item_codigo: "CR.602.01 (P-48\")",
      item_nombre: "Tubería PEAD corrugada, doble pared de 48\" de diámetro (DCVP-32-2024-0188)"
    },
    {
      item_codigo: "CRL101",
      item_nombre: "Compactador de suelo con tambor vibratorio - DVU"
    },
    {
      item_codigo: "PAL039",
      item_nombre: "Pala Excavadora Hidráulica (13,6 TM) - DVU"
    },
    {
      item_codigo: "PAL054",
      item_nombre: "Pala Excavadora Hidráulica (24,8 TM) - FVU"
    },
    {
      item_codigo: "ROM003",
      item_nombre: "Martillo Hidráulico (Montaje a excavadora)"
    },
    {
      item_codigo: "S/N (10)",
      item_nombre: "Armado y lanzado de nariz para puente modular"
    },
    {
      item_codigo: "S/N (11)",
      item_nombre: "Desarme de puente modular"
    },
    {
      item_codigo: "S/N (12)",
      item_nombre: "Desarme de nariz para puente modular"
    },
    {
      item_codigo: "S/N (4)",
      item_nombre: "Concreto inyectado 280 kg/cm2"
    },
    {
      item_codigo: "S/N (5)",
      item_nombre: "Cerramiento paralelo al flujo de agua en acero. Fabricado y rigido (No incluye el suministro de elementos de acero)"
    },
    {
      item_codigo: "S/N (6)",
      item_nombre: "Construcción de malla perimetral ciclón de 2,0 metros de altura"
    },
    {
      item_codigo: "S/N (7)",
      item_nombre: "Transporte de piezas para puente modular (Caldera - Monteverde o Monteverde - Caldera)"
    },
    {
      item_codigo: "S/N (8)",
      item_nombre: "Construcción de terraza de lanzamiento para puentes modulares (medido en vehículo)"
    },
    {
      item_codigo: "S/N (9)",
      item_nombre: "Armado y lanzado de puente modular"
    },
    {
      item_codigo: "TRI001",
      item_nombre: "Torre portatil de iluminación (6 m. Diesel) - 2 Luces"
    },
    {
      item_codigo: "TRI003",
      item_nombre: "Torre portatil de iluminación (9 m. Diesel) - 4 Luces"
    }
  ],
  "2022CD-000145-0006000001::3-2": [
    {
      item_codigo: "CRL015",
      item_nombre: "COMPACTAOR. VIBRATORIO DE RODILLO PROPUL. LLANTA"
    },
    {
      item_codigo: "S/N (10)",
      item_nombre: "Armado de nariz de puente modular nuevo"
    },
    {
      item_codigo: "S/N (11)",
      item_nombre: "Desarmado de Nariz y Transporte a Bodega de Conavi en Incofer"
    },
    {
      item_codigo: "S/N (12)",
      item_nombre: "Suministro e hincado de pilotes de acero HP 12x53 de 12 m de longitud"
    },
    {
      item_codigo: "S/N (13)",
      item_nombre: "Suministro y colocación de acero G50 para construcción de pilas"
    },
    {
      item_codigo: "S/N (14)",
      item_nombre: "Desarme y recuperacion de piezas de puente existente"
    },
    {
      item_codigo: "S/N (15)",
      item_nombre: "Restitución de apoyo con lámina de acero de 1¨ de espesor en el puente existente"
    },
    {
      item_codigo: "S/N (4)",
      item_nombre: "Transporte de puente modular de Bodega de Conavi en Incofer al sitio"
    },
    {
      item_codigo: "S/N (5)",
      item_nombre: "Transporte de nariz de puente modular, de Bodega de Conavi en Incofer al sitio"
    },
    {
      item_codigo: "S/N (6)",
      item_nombre: "Excavación para hincado en lecho de río"
    },
    {
      item_codigo: "S/N (7)",
      item_nombre: "Empalmes de pilotes"
    },
    {
      item_codigo: "S/N (8)",
      item_nombre: "Construcción de terraza de lanzamiento (medido en vehículo)"
    },
    {
      item_codigo: "S/N (9)",
      item_nombre: "Armado y lanzado de puente nuevo de 112,85 m."
    }
  ],
  "2022CD-000145-0006000001::ambas": [
    {
      item_codigo: "CAB006",
      item_nombre: "Cabezal (22,5 ton) - FVU"
    },
    {
      item_codigo: "CAR100",
      item_nombre: "Traileta (Carga útil 30 ton) FVU"
    },
    {
      item_codigo: "CR.202.04(A)",
      item_nombre: "Remoción individual de árboles (150 mm hasta 400 mm de diámetro)"
    },
    {
      item_codigo: "CR.202.04(B)",
      item_nombre: "Remoción individual de árboles (400 mm hasta 1000 mm de diámetro)"
    },
    {
      item_codigo: "CR.202.04(C)",
      item_nombre: "Remoción individual de árboles (mayor a 1000 mm de diámetro)"
    },
    {
      item_codigo: "CR.203.01",
      item_nombre: "Remoción de estructuras de concreto"
    },
    {
      item_codigo: "CR.204.01",
      item_nombre: "Excavación en la vía"
    },
    {
      item_codigo: "CR.204.05",
      item_nombre: "Material de préstamo selecto, Caso 2"
    },
    {
      item_codigo: "CR.208.02",
      item_nombre: "Relleno para fundación"
    },
    {
      item_codigo: "CR.209.01",
      item_nombre: "Excavación para estructuras mayores"
    },
    {
      item_codigo: "CR.251.03",
      item_nombre: "Escollera clase Tipo 4 (Suministro, acarreo y colocación de roca de río)"
    },
    {
      item_codigo: "CR.253.04",
      item_nombre: "Gaviones revestidos con PVC"
    },
    {
      item_codigo: "CR.253.04(A)",
      item_nombre: "Gaviones revestidos con PVC, tipo Terramesh 4 m de cola"
    },
    {
      item_codigo: "CR.253.04(B)",
      item_nombre: "Gaviones revestidos con PVC, tipo Terramesh 5 m de cola"
    },
    {
      item_codigo: "CR.253.04(C)",
      item_nombre: "Gaviones revestidos con PVC, tipo Terramesh 6 m de cola"
    },
    {
      item_codigo: "CR.253.06",
      item_nombre: "Colchones de revestimiento, revestidos con PVC"
    },
    {
      item_codigo: "CR.256.01",
      item_nombre: "Anclaje activo permanente en suelo"
    },
    {
      item_codigo: "CR.258.03",
      item_nombre: "Muro de retención de concreto reforzado"
    },
    {
      item_codigo: "CR.259.01",
      item_nombre: "Muros de retención de suelo cosido"
    },
    {
      item_codigo: "CR.259.02",
      item_nombre: "Fachada del muro de retención de suelo cosido"
    },
    {
      item_codigo: "CR.301.03",
      item_nombre: "Suministro, colocación y compactación de base granular, graduación C"
    },
    {
      item_codigo: "CR.301.06",
      item_nombre: "Suministro, colocación y compactación de sub base granular, graduación D"
    },
    {
      item_codigo: "CR.552.01(A)",
      item_nombre: "Concreto hidráulico para estructuras mayores clase A (25 Mpa)"
    },
    {
      item_codigo: "CR.552.02",
      item_nombre: "Concreto hidráulico para estructuras mayores clase B (17 Mpa)"
    },
    {
      item_codigo: "CR.552.02(B)",
      item_nombre: "Concreto hidráulico para estructuras mayores clase A (28 Mpa)"
    },
    {
      item_codigo: "CR.552.02(D)",
      item_nombre: "Concreto hidráulico para estructuras mayores clase P (35 Mpa)"
    },
    {
      item_codigo: "CR.554.01",
      item_nombre: "Acero de refuerzo Grado 40"
    },
    {
      item_codigo: "CR.602.01(A)",
      item_nombre: "Tubería de concreto reforzado Clase III - C 76, diámetro 600 mm"
    },
    {
      item_codigo: "CR.602.01(C)",
      item_nombre: "Tubería de concreto reforzado Clase III - C 76, diámetro 800 mm"
    },
    {
      item_codigo: "CR.602.01(D)",
      item_nombre: "Tubería de concreto reforzado Clase III - C 76, diámetro 900 mm"
    },
    {
      item_codigo: "CR.602.01(E)",
      item_nombre: "Tubería de concreto reforzado Clase III - C 76, diámetro 1000 mm"
    },
    {
      item_codigo: "CR.602.01(F)",
      item_nombre: "Tubería de concreto reforzado Clase III - C 76, diámetro 1200 mm"
    },
    {
      item_codigo: "CR.602.01(G)",
      item_nombre: "Tubería de concreto reforzado Clase III - C 76, diámetro 1500 mm"
    },
    {
      item_codigo: "CR.602.01(H)",
      item_nombre: "Tubería de concreto reforzado Clase III - C 76, diámetro 1800 mm"
    },
    {
      item_codigo: "CR.602.01(I)",
      item_nombre: "Tubería de concreto reforzado Clase III - C 76, diámetro 2130 mm"
    },
    {
      item_codigo: "CR.604.07",
      item_nombre: "Tapas de cabezales y cajas de registro"
    },
    {
      item_codigo: "CR.608.01",
      item_nombre: "Revestimiento de canales, cunetas y contracunetas \"Tipo IV\""
    },
    {
      item_codigo: "CR.609.02",
      item_nombre: "Canales, cunetas y contracunetas"
    },
    {
      item_codigo: "CR.610.02",
      item_nombre: "Sistemas de drenajes de perforación horizontal de 50 mm de diámetro, incluye geotextil y cualquier elemento adicional (incluyendo uniones, codos, empalmes y demás accesorios)"
    },
    {
      item_codigo: "CR.615.01",
      item_nombre: "Construcción de aceras"
    },
    {
      item_codigo: "CR.633.01(A)",
      item_nombre: "Suministro e instalación de señales verticales (Chevron)"
    },
    {
      item_codigo: "CR.633.01(E)",
      item_nombre: "Suministro e instalación de señales verticales (Vía Cerrada Adelante)"
    },
    {
      item_codigo: "CR.633.01(F)",
      item_nombre: "Suministro e instalación de señales verticales (Emergencia Delineador)"
    },
    {
      item_codigo: "CR.633.01(G)",
      item_nombre: "Suministro e instalación de señales verticales (Peligro)"
    },
    {
      item_codigo: "CR.633.01(H)",
      item_nombre: "Suministro e instalación de señales verticales (Crucre Fauna)"
    },
    {
      item_codigo: "CR.709.01",
      item_nombre: "Acero estructural Grado 60"
    },
    {
      item_codigo: "CV.103.01",
      item_nombre: "Descuaje de árboles"
    },
    {
      item_codigo: "CV.106.07",
      item_nombre: "Hormigón ciclópeo"
    },
    {
      item_codigo: "CV.108.01",
      item_nombre: "Remoción de derrumbes"
    },
    {
      item_codigo: "CV.201.01",
      item_nombre: "Limpieza de cunetas y canales revestidos de manera manual"
    },
    {
      item_codigo: "CV.202.01",
      item_nombre: "Conformación de cunetas y espaldones"
    },
    {
      item_codigo: "CV.603.02",
      item_nombre: "Reparación parcial o reposición total de barandas de acero en puentes"
    },
    {
      item_codigo: "CV.604.02",
      item_nombre: "Reemplazo y complementación de dispositivos de drenajes de puentes"
    },
    {
      item_codigo: "CV.606.01",
      item_nombre: "Limpieza y sellado de grietas en elementos de concreto de puentes"
    },
    {
      item_codigo: "CV.609.01",
      item_nombre: "Reemplazo de juntas de expansión"
    },
    {
      item_codigo: "CV.610.01",
      item_nombre: "Reemplazo de apoyos de puentes"
    },
    {
      item_codigo: "CV.610.02",
      item_nombre: "Mantenimiento de apoyo de puentes"
    },
    {
      item_codigo: "CV.614.01",
      item_nombre: "Retiro y reposición de pernos, pines y tornillos de alta resistencia en puentes"
    },
    {
      item_codigo: "CV.702.01(A)",
      item_nombre: "Suministro e instalación de viga galvanizada para guardacamino"
    },
    {
      item_codigo: "CV.702.01(B)",
      item_nombre: "Suministro e instalación de postes para guardacamino"
    },
    {
      item_codigo: "CV.702.02(A)",
      item_nombre: "Remoción de barrera de seguridad tipo viga galvanizada para guardacamino"
    },
    {
      item_codigo: "CV.702.02(B)",
      item_nombre: "Remoción de barrera de seguridad tipo poste para guardacamino"
    },
    {
      item_codigo: "CV.702.13",
      item_nombre: "Suministro e instalación de terminales de barreras de contención vehicular"
    },
    {
      item_codigo: "CV.702.22",
      item_nombre: "Suministro de transición entre sistemas de doble honda a New Jersey"
    },
    {
      item_codigo: "CV.702.23",
      item_nombre: "Instalación de transición entre sistemas"
    },
    {
      item_codigo: "M20(A)",
      item_nombre: "Chapea del derecho de vía"
    },
    {
      item_codigo: "M20(E)",
      item_nombre: "Recolección de basura"
    },
    {
      item_codigo: "M21(F)",
      item_nombre: "Limpieza de tomas, cabezales y alcantarillas"
    },
    {
      item_codigo: "M21(H)",
      item_nombre: "Brigada limpieza de derecho de vía y activos viales"
    },
    {
      item_codigo: "M41(D)",
      item_nombre: "Bacheo de urgencia"
    },
    {
      item_codigo: "M643(1)1",
      item_nombre: "Diseño de muros de retención, tipos I,II,III,IV,V y VI"
    },
    {
      item_codigo: "M643(1)2",
      item_nombre: "Diseño de muros de retención, tipos VII, VIII, IX, X, XI y XII"
    },
    {
      item_codigo: "M643(1)3",
      item_nombre: "Diseño de muros de retención, tipo XIII, XIV, XV, XVI, XVII, XIX y XX"
    },
    {
      item_codigo: "M643(1)4",
      item_nombre: "Diseño de muros de retención, tipo XXI, XXII, XXIII y XIV"
    },
    {
      item_codigo: "MP-50(A)",
      item_nombre: "Brigada de limpieza de puentes"
    },
    {
      item_codigo: "NIV120",
      item_nombre: "Motoniveladora Articulada EROPS (CAT 140H) - DVU"
    },
    {
      item_codigo: "PAL035",
      item_nombre: "Pala Excavadora Hidraúlica (22,1 ton) - DVU"
    },
    {
      item_codigo: "RET060",
      item_nombre: "Cargador Retroexcavador Llantas 4WD - 86 HP - DVU"
    },
    {
      item_codigo: "S/N",
      item_nombre: "Estudios y diseños hidrológicos e hidráulocos para drenajes"
    },
    {
      item_codigo: "S/N (1)",
      item_nombre: "Cuadrílla de topografía"
    },
    {
      item_codigo: "S/N (2)",
      item_nombre: "Suministro y colocación de postes delineadores abatibles"
    },
    {
      item_codigo: "S/N (3)",
      item_nombre: "Suministro y colocación de tachuelones de aluminio"
    },
    {
      item_codigo: "TAN009",
      item_nombre: "Tanque de agua (45500 L) - DVU"
    },
    {
      item_codigo: "VAG203",
      item_nombre: "Vagoneta (9m³ -11m³) - FVU"
    },
    {
      item_codigo: "VAG300",
      item_nombre: "Vagoneta (12m³ -14m³) - DVU"
    }
  ],
  "2022CD-000149-0006000001::ambas": [
    {
      item_codigo: "CR.204.02",
      item_nombre: "Excavación en la vía"
    },
    {
      item_codigo: "CR.301.01",
      item_nombre: "Suministro, colocación y compactación sub base granular, graduación D"
    },
    {
      item_codigo: "CR.301.02",
      item_nombre: "Suministro, colocación y compactación de base granular, graduación C"
    },
    {
      item_codigo: "CR.301.02 (B)",
      item_nombre: "Suministro y colocación de base granular para reacondicionamiento de la calzada, graduación C"
    },
    {
      item_codigo: "CR.302.01",
      item_nombre: "Base reciclada estabilizada con cemento tipo BE-25"
    },
    {
      item_codigo: "CR.411.01",
      item_nombre: "Tratamiento superficial simple"
    },
    {
      item_codigo: "CR.411.02",
      item_nombre: "Tratamiento superficial doble"
    },
    {
      item_codigo: "CR.411.03",
      item_nombre: "Tratamiento superficial triple"
    },
    {
      item_codigo: "CR.412.01",
      item_nombre: "Sello con lechada del tipo Slurry o Microcapas"
    },
    {
      item_codigo: "CR.414.01",
      item_nombre: "Riego de imprimación con emulsión asfáltica de cura rápida"
    },
    {
      item_codigo: "CR.414.03",
      item_nombre: "Sello de niebla asfáltica (Fogseal)"
    },
    {
      item_codigo: "CR.415.01",
      item_nombre: "Perfilado de pavimento para borrado de demarcación horizontal"
    },
    {
      item_codigo: "CR.416.03",
      item_nombre: "Ruteo y sellado de grietas"
    },
    {
      item_codigo: "CR.420.01",
      item_nombre: "Geomalla Biaxial"
    },
    {
      item_codigo: "CR.502.01",
      item_nombre: "Bacheo del pavimento de concreto"
    },
    {
      item_codigo: "CR.502.02",
      item_nombre: "Sellado de juntas y grietas"
    },
    {
      item_codigo: "CR.634.01 (01) -A",
      item_nombre: "Demarcación de línea continua (Línea Continua amarilla)"
    },
    {
      item_codigo: "CR.634.01 (01) –I",
      item_nombre: "Demarcación de línea continua (Línea Continua amarilla)"
    },
    {
      item_codigo: "CR.634.01(02) - A",
      item_nombre: "Demarcación de línea continua (Línea continua blanca)"
    },
    {
      item_codigo: "CR.634.01(02) – I",
      item_nombre: "Demarcación de línea continua (Línea continua blanca)"
    },
    {
      item_codigo: "CR.634.02 (01) -A",
      item_nombre: "Demarcación de línea discontinua (Línea Intermitente amarilla)"
    },
    {
      item_codigo: "CR.634.02 (01) –I",
      item_nombre: "Demarcación de línea discontinua (Línea Intermitente amarilla)"
    },
    {
      item_codigo: "CR.634.02 (02) - A",
      item_nombre: "Demarcación de línea discontinua (Línea Intermitente blanca)"
    },
    {
      item_codigo: "CR.634.02 (02) - I",
      item_nombre: "Demarcación de línea discontinua (Línea Intermitente blanca)"
    },
    {
      item_codigo: "CR.634.03 - A",
      item_nombre: "Demarcación de línea discontinua corta (Línea Intermitente blanca corta)"
    },
    {
      item_codigo: "CR.634.03 – I",
      item_nombre: "Demarcación de línea discontinua corta (Línea Intermitente blanca corta)"
    },
    {
      item_codigo: "CR.634.04",
      item_nombre: "Diseño de señalización horizontal permanente"
    },
    {
      item_codigo: "CR.634.05 - A",
      item_nombre: "Demarcación de flechas direccionales"
    },
    {
      item_codigo: "CR.634.05 – I",
      item_nombre: "Demarcación de flechas direccionales"
    },
    {
      item_codigo: "CR.634.07 - A",
      item_nombre: "Demarcación de letrero de alto"
    },
    {
      item_codigo: "CR.634.07 – I",
      item_nombre: "Demarcación de letrero de alto"
    },
    {
      item_codigo: "CR.634.08 - A",
      item_nombre: "Demarcación de letrero de ceda"
    },
    {
      item_codigo: "CR.634.08 -I",
      item_nombre: "Demarcación de letrero de ceda"
    },
    {
      item_codigo: "CR.634.09 - A",
      item_nombre: "Demarcación de letrero de escuela"
    },
    {
      item_codigo: "CR.634.09 – I",
      item_nombre: "Demarcación de letrero de escuela"
    },
    {
      item_codigo: "CR.634.10 - A",
      item_nombre: "Demarcación de letrero de velocidad máxima"
    },
    {
      item_codigo: "CR.634.10 – I",
      item_nombre: "Demarcación de letrero de velocidad máxima"
    },
    {
      item_codigo: "CR.634.11 - A",
      item_nombre: "Demarcación de letrero de cruce de ferrocarril"
    },
    {
      item_codigo: "CR.634.11 – I",
      item_nombre: "Demarcación de letrero de cruce de ferrocarril"
    },
    {
      item_codigo: "CR.634.12 - A",
      item_nombre: "Demarcación de letrero de solo"
    },
    {
      item_codigo: "CR.634.12 – I",
      item_nombre: "Demarcación de letrero de solo"
    },
    {
      item_codigo: "CR.634.14",
      item_nombre: "Señales rígidas sobre pavimento (Captaluces 1 Cara blanca)"
    },
    {
      item_codigo: "CR.634.15 (A)",
      item_nombre: "Señales rígidas sobre pavimento (Captaluces 2 Cara Roja)"
    },
    {
      item_codigo: "CR.634.15 (B)",
      item_nombre: "Señales rígidas sobre pavimento (Captaluces 2 Caras Amarillas)"
    },
    {
      item_codigo: "CR.634.15 C",
      item_nombre: "Señales rígidas sobre pavimento (Captaluces 1 Cara blanca 1 Cara roja)"
    },
    {
      item_codigo: "CR.634.16 - A",
      item_nombre: "Demarcación de pasos peatonales tipo cebra"
    },
    {
      item_codigo: "CR.634.16 – I",
      item_nombre: "Demarcación de pasos peatonales tipo cebra"
    },
    {
      item_codigo: "CR.634.20",
      item_nombre: "Demarcación de isla de canalización (Isla de Canalización Amarilla)"
    },
    {
      item_codigo: "CR.634.20 (01)- A",
      item_nombre: "Demarcación de isla de canalización (Isla de Canalización Amarilla)"
    },
    {
      item_codigo: "CR.634.20 (02)- A",
      item_nombre: "Demarcación de isla de canalización (Isla de Canalización Blanca)"
    },
    {
      item_codigo: "CR.634.20 (02)- I",
      item_nombre: "Demarcación de isla de canalización (Isla de Canalización Blanca)"
    },
    {
      item_codigo: "CR.701.01",
      item_nombre: "Cemento Portland"
    },
    {
      item_codigo: "CR303.03",
      item_nombre: "Reacondicionamiento de la calzada"
    },
    {
      item_codigo: "CR414.05",
      item_nombre: "Material de secado"
    },
    {
      item_codigo: "CR415.01",
      item_nombre: "Perfilado de capas asfálticas"
    },
    {
      item_codigo: "CRL203",
      item_nombre: "Compactador vibratorio de rodillo propulsor llanta, Caterpillar CS 533E o de similares especificaciones"
    },
    {
      item_codigo: "CV.210.02",
      item_nombre: "Levantamiento de tapas de pozos"
    },
    {
      item_codigo: "CV.703.01",
      item_nombre: "Limpieza profunda de la superficie a demarcar"
    },
    {
      item_codigo: "CV.703.25",
      item_nombre: "Sellador (primer)"
    },
    {
      item_codigo: "DLA002",
      item_nombre: "Distribuidor de Asfalto (2000 galones)"
    },
    {
      item_codigo: "M403(1) A",
      item_nombre: "Diseño de rehabilitaciones y sobre capas asfálticas"
    },
    {
      item_codigo: "M41 (A2)",
      item_nombre: "Bacheo a profundidad parcial con mezcla asfáltica en caliente"
    },
    {
      item_codigo: "M41(A)",
      item_nombre: "Bacheo con mezcla asfáltica en caliente"
    },
    {
      item_codigo: "M45(A)",
      item_nombre: "Pavimento bituminoso en caliente"
    },
    {
      item_codigo: "M45(E)",
      item_nombre: "Pavimento bituminoso en caliente con polímeros"
    },
    {
      item_codigo: "NIV127",
      item_nombre: "Motoniveladora articulada Erops John Deere 670D o de similares especificaciones"
    },
    {
      item_codigo: "RES-500",
      item_nombre: "Recuperadora de caminos/estabilizadora de suelos"
    },
    {
      item_codigo: "RET041",
      item_nombre: "Cargador retroexcavador llantas 4WD Caterpillar 416D o de similares especificaciones"
    },
    {
      item_codigo: "S/N (1)",
      item_nombre: "Suministro de 1 Encargado, 1 camion brigada, 1 chofer, 3 peones y agua"
    },
    {
      item_codigo: "S/N (2)",
      item_nombre: "Acarreo de material de perfilado"
    },
    {
      item_codigo: "S/N (2-2)",
      item_nombre: "Carga, acarreo y colocación de material de perfilado (medido en vehículo de acarreo) – (incluye emulsión asfáltica)"
    },
    {
      item_codigo: "S/N (3)",
      item_nombre: "Carga y colocación de material de perfilado, medido en vehículo de acarreo"
    },
    {
      item_codigo: "TAN011",
      item_nombre: "Distribuidor tanque de agua 4000 gl o de similares especificaciones"
    },
    {
      item_codigo: "VAG300",
      item_nombre: "Vagoneta (12 m3 - 14 m3) fuera de vida útil"
    }
  ]
};

