async function run() {
  try {
    const resEst = await fetch('http://localhost:3005/estudiantes?select=id,usuario_id,usuarios(correo)');
    const est = await resEst.json();
    console.log('ESTUDIANTES:', est);

    const resSuf = await fetch('http://localhost:3005/suficiencia_ingles');
    const suf = await resSuf.json();
    console.log('SUFICIENCIA INGLES RECORDS:', suf);
  } catch (err) {
    console.error(err);
  }
}
run();
