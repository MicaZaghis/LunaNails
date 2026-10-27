// TODO: toda la configuración del salón vive acá
export const CFG = {
  nombre: "Nails by Luna",
  instagram: "nailsbyluna1_",
  payUrl: "https://mpago.la/1EBPd4G", // link de la billetera virtual
  alias: "",            // alias para transferir (opcional, se muestra junto al botón)
  sena: 5000,
  dias: 15,             // días hacia adelante que se pueden reservar
  // horarios por día de la semana (0=domingo ... 6=sábado)
  horarios: { 1: [16], 2: [8, 14, 16], 3: [8, 14, 16], 4: [8, 14, 16], 5: [8, 14, 16], 6: [8, 14, 16] },
  servicios: [
    { id: "esc", n: "Esculpidas en polygel", p: 25000 },
    { id: "ext", n: "Extensiones de soft gel", p: 23000 },
    { id: "cap", n: "Capping en polygel", p: 22000 },
    { id: "sem", n: "Esmaltado semipermanente", p: 20000 },
    { id: "ret", n: "Retirado", p: 7000 },
    { id: "rto", n: "Retirado de otras colegas", p: 10000 }
  ],
  nota: "Diseños con relieves, 3D y pedrería se cobran aparte."
};
