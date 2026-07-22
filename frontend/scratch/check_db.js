async function run() {
  try {
    const res = await fetch('http://localhost:3005/usuarios');
    const users = await res.json();
    console.log('USERS:', users);
    
    const resRoles = await fetch('http://localhost:3005/usuario_roles?select=usuario_id,roles(nombre)');
    const roles = await resRoles.json();
    console.log('ROLES:', roles);

    const resConv = await fetch('http://localhost:3005/convenios_practicas');
    const conv = await resConv.json();
    console.log('CONVENIOS:', conv);
  } catch (err) {
    console.error(err);
  }
}
run();
