const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// NUEVAS IMPORTACIONES para User-Agent (opcional)
const useragent = require('useragent');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar Express para confiar en el proxy (si se usa)
app.set('trust proxy', true);

// Middlewares
app.use(cors());
app.use(express.json());

// ──────────────────────────────────────────────────────────
// 1) CONFIGURACIÓN MULTER (Subida de imágenes)
// ──────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Guardar en /public/uploads
    cb(null, path.join(__dirname, 'public/uploads'));
  },
  filename: (req, file, cb) => {
    // Ej: 1692196765123-nombre.jpg
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });


// Servir la carpeta de uploads como estático
app.use('../../backend/public/uploads', express.static(path.join(__dirname, 'public/uploads')));


app.use('../../backend/public/suppliers', express.static(path.join(__dirname, 'public/suppliers')));

// Configuración de Multer (para logo de la tienda, por ejemplo)
const storageSuppliers = multer.diskStorage({
  destination: (req, file, cb) => {
    // Guardar en /public/suppliers
    cb(null, path.join(__dirname, 'public/suppliers'));
  },
  filename: (req, file, cb) => {
    // Ej: 1678901234567-nombre_original.png
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const uploadSuppliers = multer({ storage: storageSuppliers });

// Configuración de Multer para manejo de archivos en perfil (guardados en public/profile)
const storageProfile = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public/profile'));
  },
  filename: (req, file, cb) => {
    // Puedes personalizar el nombre del archivo si lo deseas
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const uploadProfile = multer({ storage: storageProfile });

// Servir archivos estáticos (para imágenes de perfil)
app.use('../../backend/public/profile', express.static(path.join(__dirname, 'public/profile')));

// ──────────────────────────────────────────────────────────
// 2) CONEXIÓN A LA BASE DE DATOS
// ──────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10, // Puedes ajustar según tu necesidad
  queueLimit: 0,
});

// Verificar conexión
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error de conexión a la base de datos:', err);
    return;
  }
  console.log('Conexión exitosa a la base de datos');
  connection.release(); // Liberamos la conexión al pool
});

// Exportamos el pool para usarlo en los endpoints
module.exports = pool;

// =====================================================
// ===============     ENDPOINTS      ==================
// =====================================================

// [1] Endpoint de registro
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, phone, countryCode, email, password, role } = req.body;
    const roleQuery = 'SELECT id FROM roles WHERE name = ? LIMIT 1';
    pool.query(roleQuery, [role], async (err, roleResults) => {
      if (err) {
        console.error('Error obteniendo el rol:', err);
        return res.status(500).json({ error: 'Error al obtener el rol' });
      }
      if (roleResults.length === 0) {
        return res.status(400).json({ error: 'Rol inválido' });
      }
      const roleId = roleResults[0].id;
      const hashedPassword = await bcrypt.hash(password, 10);
      const userUuid = uuidv4();
      const insertUserQuery = `
        INSERT INTO users (
          uuid, first_name, last_name, country_code, phone, email, password, role_id,
          created_at, updated_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 'OFF')
      `;
      pool.query(
        insertUserQuery,
        [userUuid, firstName, lastName, countryCode, phone, email, hashedPassword, roleId],
        (err, result) => {
          if (err) {
            console.error('Error en el registro:', err);
            return res.status(500).json({ error: 'Error al registrar usuario' });
          }
          // Actualizar el status a ON después de registrar
          const updateStatusQuery = `UPDATE users SET status = 'ON' WHERE id = ?`;
          pool.query(updateStatusQuery, [result.insertId], (err) => {
            if (err) {
              console.error('Error actualizando el status a ON:', err);
              return res.status(500).json({ error: 'Error al actualizar el estado del usuario' });
            }
            return res.status(201).json({
              message: 'Usuario registrado exitosamente',
              userId: result.insertId,
              uuid: userUuid,
              roleId: roleId,
            });
          });
        }
      );
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
});


// [2] Endpoint de login (sin columnas ip, city, country)
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const selectQuery = `
    SELECT users.*, roles.name AS role_name 
    FROM users 
    INNER JOIN roles ON users.role_id = roles.id
    WHERE users.email = ? 
    LIMIT 1
  `;

  pool.query(selectQuery, [email], async (err, results) => {
    if (err) {
      console.error('Error en la consulta de login:', err);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    if (results.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña inválidos' });
    }

    const user = results[0];
    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: 'Usuario o contraseña inválidos' });
      }
    } catch (compareError) {
      console.error('Error comparando contraseñas:', compareError);
      return res.status(500).json({ error: 'Error en la comparación de contraseñas' });
    }

    // Actualizar last_login y status
    const updateLastLoginQuery = `UPDATE users SET last_login = NOW() WHERE id = ?`;
    pool.query(updateLastLoginQuery, [user.id], (err) => {
      if (err) {
        console.error('Error al actualizar last_login:', err);
        return res.status(500).json({ error: 'Error al actualizar la hora de inicio de sesión' });
      }
    });

    const updateStatusQuery = `UPDATE users SET status = 'ON' WHERE id = ?`;
    pool.query(updateStatusQuery, [user.id], (err) => {
      if (err) {
        console.error('Error actualizando el status a ON:', err);
        return res.status(500).json({ error: 'Error al actualizar el estado del usuario' });
      }
    });

    // Obtener información del dispositivo (browser y sistema operativo)
    const agent = useragent.parse(req.headers['user-agent'] || '');
    const browser = agent.family || '';
    const os = agent.os.family || '';

    console.log('Datos del dispositivo:', { browser, os });

    // Verificar si ya existe una sesión para este usuario en este dispositivo
    const checkSessionQuery = `
      SELECT id FROM sesiones 
      WHERE user_uuid = ? AND browser = ? AND os = ?
      ORDER BY date_time_login DESC
      LIMIT 1
    `;
    pool.query(checkSessionQuery, [user.uuid, browser, os], (checkErr, checkResults) => {
      if (checkErr) {
        console.error('Error al verificar sesión existente:', checkErr);
        // Si falla la verificación, procedemos a insertar una nueva sesión
        return insertNewSession();
      }

      if (checkResults.length > 0) {
        // Ya existe una sesión: actualizar la fecha de inicio
        const sessionId = checkResults[0].id;
        console.log('Sesión existente encontrada, ID:', sessionId);
        const updateSessionQuery = `UPDATE sesiones SET date_time_login = NOW() WHERE id = ?`;
        pool.query(updateSessionQuery, [sessionId], (updateErr) => {
          if (updateErr) {
            console.error('Error al actualizar sesión existente:', updateErr);
          } else {
            console.log('Sesión actualizada exitosamente, ID:', sessionId);
          }
          return res.json({
            message: 'Login exitoso',
            userId: user.id,
            email: user.email,
            role: user.role_name,
            uuid: user.uuid,
          });
        });
      } else {
        // No existe sesión previa, insertar nueva
        return insertNewSession();
      }
    });

    function insertNewSession() {
      const insertSessionQuery = `
        INSERT INTO sesiones (
          user_uuid,
          date_time_login,
          browser,
          os
        ) VALUES (?, NOW(), ?, ?)
      `;
      pool.query(
        insertSessionQuery,
        [user.uuid, browser, os],
        (sessErr, sessResult) => {
          if (sessErr) {
            console.error('Error insertando sesión:', sessErr);
            // No es fatal para el login, sólo registramos el error
          } else {
            console.log('Nueva sesión insertada, ID:', sessResult.insertId);
          }
          return res.json({
            message: 'Login exitoso',
            userId: user.id,
            email: user.email,
            role: user.role_name,
            uuid: user.uuid,
          });
        }
      );
    }
  });
});

// Nuevo endpoint: DELETE /api/sessions/:id
app.delete('/api/sessions/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM sesiones WHERE id = ?';
  pool.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al borrar la sesión:', err);
      return res.status(500).json({ error: 'Error al borrar la sesión' });
    }
    // Se borra únicamente el registro de sesión con el ID proporcionado
    return res.json({ message: 'Sesión cerrada correctamente', clearLocalStorage: false });
  });
});



// [3] Endpoint de logout - Borra el registro de sesiones de la base de datos
app.post('/api/logout', (req, res) => {
  // Ahora esperamos que el front envíe user_uuid en lugar de userId
  const { user_uuid } = req.body;
  if (!user_uuid) {
    return res.status(400).json({ error: 'Se requiere user_uuid para logout' });
  }
  const deleteSessionQuery = 'DELETE FROM sesiones WHERE user_uuid = ?';
  pool.query(deleteSessionQuery, [user_uuid], (err) => {
    if (err) {
      console.error('Error borrando sesiones:', err);
      return res.status(500).json({ error: 'Error al borrar sesiones' });
    }
    return res.json({
      message: 'Logout exitoso',
      clearLocalStorage: true
    });
  });
});

// [4] Endpoint para obtener todos los usuarios
app.get('/api/users', (req, res) => {
  const query = `
    SELECT users.id, users.first_name, users.last_name, users.email, users.phone, 
           users.created_at, users.status, users.uuid, roles.name AS role_name
    FROM users
    INNER JOIN roles ON users.role_id = roles.id
  `;
  pool.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Error en la consulta' });
    }
    return res.json(results);
  });
});

// [5] Endpoint para obtener el perfil del usuario
app.get('/api/user', (req, res) => {
  const { uuid } = req.query;
  if (!uuid) {
    return res.status(400).json({ error: 'UUID de usuario requerido' });
  }
  const query = `
    SELECT first_name, last_name, email, phone, address, profile_image
    FROM users
    WHERE uuid = ?
    LIMIT 1
  `;
  pool.query(query, [uuid], (err, results) => {
    if (err) {
      console.error('Error obteniendo datos del usuario:', err);
      return res.status(500).json({ error: 'Error al obtener datos del usuario' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.json(results[0]);
  });
});

// ===========================================
// [6] Endpoint para guardar/actualizar el perfil en la tabla users
// ===========================================
app.post('/api/profile', uploadProfile.single('profile_image'), (req, res) => {
  const { first_name, last_name, email, country_code, phone, address } = req.body;
  const user_uuid = req.headers.authorization;
  let imagen = null;
  if (req.file) {
    // La ruta que se guardará en la BD y que será accesible desde el frontend
    imagen = `../../backend/public/profile/${req.file.filename}`;
  }
  const checkEmailQuery = 'SELECT COUNT(*) AS count FROM users WHERE email = ? AND uuid != ?';
  pool.query(checkEmailQuery, [email, user_uuid], (err, result) => {
    if (err) {
      console.error('Error al verificar el email:', err);
      return res.status(500).json({ error: 'Error al verificar el email' });
    }
    if (result[0].count > 0) {
      return res.status(400).json({ error: 'El email ya está en uso. Por favor elija otro.' });
    }
    const validCountryCode = country_code || '57';
    const updateUserQuery = `
      UPDATE users 
      SET 
        first_name = ?, 
        last_name = ?, 
        email = ?, 
        country_code = ?, 
        phone = ?, 
        address = ?,
        imagen = ?
      WHERE uuid = ?
    `;
    pool.query(
      updateUserQuery,
      [first_name, last_name, email, validCountryCode, phone, address, imagen, user_uuid],
      (err2) => {
        if (err2) {
          console.error('Error al actualizar el perfil:', err2);
          return res.status(500).json({ error: 'Error al actualizar el perfil' });
        }
        return res.json({ message: 'Perfil actualizado correctamente', imagen });
      }
    );
  });
});



// [7] Endpoint para obtener el first_name del usuario
app.get('/api/user-profile', (req, res) => {
  const { user_uuid } = req.query;
  if (!user_uuid) {
    return res.status(400).json({ error: 'Se requiere user_uuid' });
  }
  // Seleccionamos los campos que necesitamos, incluyendo la imagen
  const query = 'SELECT first_name, last_name, email, phone, address, imagen FROM users WHERE uuid = ? LIMIT 1';
  pool.query(query, [user_uuid], (err, results) => {
    if (err) {
      console.error('Error obteniendo el perfil:', err);
      return res.status(500).json({ error: 'Error en la base de datos' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.json(results[0]);
  });
});


// [8] Endpoint para cambiar la contraseña
app.post('/api/change-password', (req, res) => {
  const { user_uuid, currentPassword, newPassword } = req.body;
  if (!user_uuid || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }
  const checkPasswordQuery = 'SELECT password FROM users WHERE uuid = ?';
  pool.query(checkPasswordQuery, [user_uuid], (err, result) => {
    if (err) {
      console.error('Error al verificar la contraseña:', err);
      return res.status(500).json({ error: 'Error al verificar la contraseña' });
    }
    const user = result[0];
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    bcrypt.compare(currentPassword, user.password, (err2, isMatch) => {
      if (err2) {
        console.error('Error comparando contraseñas:', err2);
        return res.status(500).json({ error: 'Error al comparar contraseñas' });
      }
      if (!isMatch) {
        return res.status(400).json({ error: 'Contraseña actual incorrecta' });
      }
      bcrypt.hash(newPassword, 10, (err3, hashedPassword) => {
        if (err3) {
          console.error('Error al hashear la contraseña:', err3);
          return res.status(500).json({ error: 'Error al hashear la contraseña' });
        }
        const updatePasswordQuery = 'UPDATE users SET password = ? WHERE uuid = ?';
        pool.query(updatePasswordQuery, [hashedPassword, user_uuid], (err4) => {
          if (err4) {
            console.error('Error al actualizar la contraseña:', err4);
            return res.status(500).json({ error: 'Error al actualizar la contraseña' });
          }
          return res.json({ message: 'Contraseña actualizada correctamente' });
        });
      });
    });
  });
});

// [GET] Endpoint para productos
app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM products';
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error obteniendo productos:', err);
      return res.status(500).json({ error: 'Error obteniendo productos' });
    }
    res.json(results);
  });
});

// [9] Endpoint para obtener departamentos
app.get('/api/departments', (req, res) => {
  const query = 'SELECT id, name FROM departamentos';
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error obteniendo los departamentos:', err);
      return res.status(500).json({ error: 'Error obteniendo los departamentos' });
    }
    res.json(results);
  });
});

// [10] Endpoint para obtener ciudades de un departamento
app.get('/api/cities/:departmentId', (req, res) => {
  const { departmentId } = req.params;
  const query = 'SELECT id, nombre FROM ciudades WHERE departamento_id = ?';
  pool.query(query, [departmentId], (err, results) => {
    if (err) {
      console.error('Error obteniendo las ciudades:', err);
      return res.status(500).json({ error: 'Error al obtener ciudades' });
    }
    res.json(results);
  });
});

// ============================
//  POST: Crear un cliente
// ============================
app.post('/api/clients', (req, res) => {
  const {
    name,
    lastName,
    phone,
    email,
    identification,
    address1,
    address2,
    department,
    city,
    user_uuid
  } = req.body;

  console.log('Recibiendo datos para nuevo cliente:', {
    name, lastName, phone, email, identification, address1, address2, department, city, user_uuid
  });

  if (!name || !lastName || !phone || !email || !user_uuid) {
    console.error('Faltan campos obligatorios o user_uuid.');
    return res.status(400).json({ error: 'Faltan campos obligatorios o user_uuid.' });
  }

  console.log('User UUID recibido:', user_uuid);

  const checkQuery = `SELECT COUNT(*) AS count FROM clientes WHERE correo = ?`;
  pool.query(checkQuery, [email], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error verificando correo:', checkErr);
      return res.status(500).json({ error: 'Error al verificar el correo.' });
    }
    console.log('Resultado de la verificación del correo:', checkResults[0]);
    if (checkResults[0].count > 0) {
      console.error('El correo ya está en uso.');
      return res.status(400).json({ error: 'El correo ya está en uso. Use otro.' });
    }

    const insertClientQuery = `
      INSERT INTO clientes (
        nombre, 
        apellido, 
        telefono, 
        correo, 
        identificacion, 
        direccion1, 
        direccion2, 
        departamento_id, 
        ciudad_id,
        user_uuid,
        fecha_registro
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    pool.query(
      insertClientQuery,
      [
        name,
        lastName,
        phone,
        email,
        identification,
        address1,
        address2,
        department,
        city,
        user_uuid
      ],
      (err2, result) => {
        if (err2) {
          console.error('Error al insertar cliente:', err2);
          return res.status(500).json({ error: 'Error al insertar cliente' });
        }
        console.log('Cliente insertado correctamente, ID:', result.insertId);
        return res.json({
          message: 'Cliente insertado correctamente',
          clientId: result.insertId,
        });
      }
    );
  });
});

// ============================
//  GET: Obtener clientes
// ============================
app.get('/api/clients', (req, res) => {
  const { user_uuid } = req.query;
  if (!user_uuid) {
    return res.status(400).json({ error: 'Se requiere user_uuid' });
  }
  const query = `
    SELECT 
      c.id,
      c.nombre,
      c.apellido,
      c.telefono,
      c.correo,
      c.identificacion,
      c.direccion1,
      c.direccion2,
      c.departamento_id,
      c.ciudad_id,
      c.fecha_registro,
      d.name AS department_name,
      ci.nombre AS city_name,
      u.first_name AS user_first_name,
      u.last_name AS user_last_name
    FROM clientes c
    LEFT JOIN departamentos d ON c.departamento_id = d.id
    LEFT JOIN ciudades ci ON c.ciudad_id = ci.id
    LEFT JOIN users u ON c.user_uuid = u.uuid
    WHERE c.user_uuid = ?
    ORDER BY c.id DESC
  `;
  pool.query(query, [user_uuid], (err, results) => {
    if (err) {
      console.error('Error obteniendo clientes:', err);
      return res.status(500).json({ error: 'Error al obtener clientes' });
    }
    res.json(results);
  });
});

// ============================
//  PUT: Actualizar un cliente
// ============================
app.put('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    apellido,
    telefono,
    correo,
    identificacion,
    direccion1,
    direccion2,
    departamento_id,
    ciudad_id
  } = req.body;
  const updateQuery = `
    UPDATE clientes 
    SET 
      nombre = ?, 
      apellido = ?, 
      telefono = ?, 
      correo = ?, 
      identificacion = ?, 
      direccion1 = ?, 
      direccion2 = ?, 
      departamento_id = ?, 
      ciudad_id = ?
    WHERE id = ?
  `;
  pool.query(
    updateQuery,
    [
      nombre,
      apellido,
      telefono,
      correo,
      identificacion,
      direccion1,
      direccion2,
      departamento_id,
      ciudad_id,
      id
    ],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.error('Error actualizando cliente (correo duplicado):', err);
          return res.status(400).json({ error: 'El correo ya está en uso. Use otro.' });
        }
        console.error('Error updating client:', err);
        return res.status(500).json({ error: 'Error al actualizar cliente' });
      }
      return res.json({ message: 'Cliente actualizado correctamente' });
    }
  );
});

// ============================
//  DELETE: Eliminar un cliente
// ============================
app.delete('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM clientes WHERE id = ?';
  pool.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al borrar cliente:', err);
      return res.status(500).json({ error: 'Error al borrar cliente' });
    }
    return res.json({ message: 'Cliente borrado correctamente' });
  });
});

// ============================
//  GET: Obtener sesiones
// ============================
app.get('/api/sessions', (req, res) => {
  const { user_uuid } = req.query;
  if (!user_uuid) {
    return res.status(400).json({ error: 'Falta user_uuid' });
  }
  const query = `
    SELECT 
      id,
      user_uuid,
      DATE_FORMAT(date_time_login, '%Y-%m-%d %H:%i:%s') AS date_time_login,
      browser,
      os
    FROM sesiones
    WHERE user_uuid = ?
    ORDER BY date_time_login DESC
  `;
  pool.query(query, [user_uuid], (err, results) => {
    if (err) {
      console.error('Error obteniendo sesiones:', err);
      return res.status(500).json({ error: 'Error al obtener sesiones' });
    }
    res.json(results);
  });
});

// [8] Endpoint para cambiar la contraseña
app.post('/api/change-password', (req, res) => {
  const { user_uuid, currentPassword, newPassword } = req.body;
  if (!user_uuid || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }
  const checkPasswordQuery = 'SELECT password FROM users WHERE uuid = ?';
  pool.query(checkPasswordQuery, [user_uuid], (err, result) => {
    if (err) {
      console.error('Error al verificar la contraseña:', err);
      return res.status(500).json({ error: 'Error al verificar la contraseña' });
    }
    const user = result[0];
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    bcrypt.compare(currentPassword, user.password, (err2, isMatch) => {
      if (err2) {
        console.error('Error comparando contraseñas:', err2);
        return res.status(500).json({ error: 'Error al comparar contraseñas' });
      }
      if (!isMatch) {
        return res.status(400).json({ error: 'Contraseña actual incorrecta' });
      }
      bcrypt.hash(newPassword, 10, (err3, hashedPassword) => {
        if (err3) {
          console.error('Error al hashear la contraseña:', err3);
          return res.status(500).json({ error: 'Error al hashear la contraseña' });
        }
        const updatePasswordQuery = 'UPDATE users SET password = ? WHERE uuid = ?';
        pool.query(updatePasswordQuery, [hashedPassword, user_uuid], (err4) => {
          if (err4) {
            console.error('Error al actualizar la contraseña:', err4);
            return res.status(500).json({ error: 'Error al actualizar la contraseña' });
          }
          return res.json({ message: 'Contraseña actualizada correctamente' });
        });
      });
    });
  });
});

// [GET] Endpoint para productos
app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM products';
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error obteniendo productos:', err);
      return res.status(500).json({ error: 'Error obteniendo productos' });
    }
    res.json(results);
  });
});

// [9] Endpoint para obtener departamentos
app.get('/api/departments', (req, res) => {
  const query = 'SELECT id, name FROM departamentos';
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error obteniendo los departamentos:', err);
      return res.status(500).json({ error: 'Error obteniendo los departamentos' });
    }
    res.json(results);
  });
});

// [10] Endpoint para obtener ciudades de un departamento
app.get('/api/cities/:departmentId', (req, res) => {
  const { departmentId } = req.params;
  const query = 'SELECT id, nombre FROM ciudades WHERE departamento_id = ?';
  pool.query(query, [departmentId], (err, results) => {
    if (err) {
      console.error('Error obteniendo las ciudades:', err);
      return res.status(500).json({ error: 'Error al obtener ciudades' });
    }
    res.json(results);
  });
});

// ============================
//  POST: Crear un cliente
// ============================
app.post('/api/clients', (req, res) => {
  const {
    name,
    lastName,
    phone,
    email,
    identification,
    address1,
    address2,
    department,
    city,
    user_uuid
  } = req.body;

  console.log('Recibiendo datos para nuevo cliente:', {
    name, lastName, phone, email, identification, address1, address2, department, city, user_uuid
  });

  if (!name || !lastName || !phone || !email || !user_uuid) {
    console.error('Faltan campos obligatorios o user_uuid.');
    return res.status(400).json({ error: 'Faltan campos obligatorios o user_uuid.' });
  }

  console.log('User UUID recibido:', user_uuid);

  const checkQuery = `SELECT COUNT(*) AS count FROM clientes WHERE correo = ?`;
  pool.query(checkQuery, [email], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error verificando correo:', checkErr);
      return res.status(500).json({ error: 'Error al verificar el correo.' });
    }
    console.log('Resultado de la verificación del correo:', checkResults[0]);
    if (checkResults[0].count > 0) {
      console.error('El correo ya está en uso.');
      return res.status(400).json({ error: 'El correo ya está en uso. Use otro.' });
    }

    const insertClientQuery = `
      INSERT INTO clientes (
        nombre, 
        apellido, 
        telefono, 
        correo, 
        identificacion, 
        direccion1, 
        direccion2, 
        departamento_id, 
        ciudad_id,
        user_uuid,
        fecha_registro
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    pool.query(
      insertClientQuery,
      [
        name,
        lastName,
        phone,
        email,
        identification,
        address1,
        address2,
        department,
        city,
        user_uuid
      ],
      (err2, result) => {
        if (err2) {
          console.error('Error al insertar cliente:', err2);
          return res.status(500).json({ error: 'Error al insertar cliente' });
        }
        console.log('Cliente insertado correctamente, ID:', result.insertId);
        return res.json({
          message: 'Cliente insertado correctamente',
          clientId: result.insertId,
        });
      }
    );
  });
});

// ============================
//  GET: Obtener clientes
// ============================
app.get('/api/clients', (req, res) => {
  const { user_uuid } = req.query;
  if (!user_uuid) {
    return res.status(400).json({ error: 'Se requiere user_uuid' });
  }
  const query = `
    SELECT 
      c.id,
      c.nombre,
      c.apellido,
      c.telefono,
      c.correo,
      c.identificacion,
      c.direccion1,
      c.direccion2,
      c.departamento_id,
      c.ciudad_id,
      c.fecha_registro,
      d.name AS department_name,
      ci.nombre AS city_name,
      u.first_name AS user_first_name,
      u.last_name AS user_last_name
    FROM clientes c
    LEFT JOIN departamentos d ON c.departamento_id = d.id
    LEFT JOIN ciudades ci ON c.ciudad_id = ci.id
    LEFT JOIN users u ON c.user_uuid = u.uuid
    WHERE c.user_uuid = ?
    ORDER BY c.id DESC
  `;
  pool.query(query, [user_uuid], (err, results) => {
    if (err) {
      console.error('Error obteniendo clientes:', err);
      return res.status(500).json({ error: 'Error al obtener clientes' });
    }
    res.json(results);
  });
});

// ============================
//  PUT: Actualizar un cliente
// ============================
app.put('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    apellido,
    telefono,
    correo,
    identificacion,
    direccion1,
    direccion2,
    departamento_id,
    ciudad_id
  } = req.body;
  const updateQuery = `
    UPDATE clientes 
    SET 
      nombre = ?, 
      apellido = ?, 
      telefono = ?, 
      correo = ?, 
      identificacion = ?, 
      direccion1 = ?, 
      direccion2 = ?, 
      departamento_id = ?, 
      ciudad_id = ?
    WHERE id = ?
  `;
  pool.query(
    updateQuery,
    [
      nombre,
      apellido,
      telefono,
      correo,
      identificacion,
      direccion1,
      direccion2,
      departamento_id,
      ciudad_id,
      id
    ],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.error('Error actualizando cliente (correo duplicado):', err);
          return res.status(400).json({ error: 'El correo ya está en uso. Use otro.' });
        }
        console.error('Error updating client:', err);
        return res.status(500).json({ error: 'Error al actualizar cliente' });
      }
      return res.json({ message: 'Cliente actualizado correctamente' });
    }
  );
});

// ============================
//  DELETE: Eliminar un cliente
// ============================
app.delete('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM clientes WHERE id = ?';
  pool.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al borrar cliente:', err);
      return res.status(500).json({ error: 'Error al borrar cliente' });
    }
    return res.json({ message: 'Cliente borrado correctamente' });
  });
});

// ============================
//  GET: Obtener sesiones
// ============================
app.get('/api/sessions', (req, res) => {
  const { user_uuid } = req.query;
  if (!user_uuid) {
    return res.status(400).json({ error: 'Falta user_uuid' });
  }
  const query = `
    SELECT 
      id,
      user_uuid,
      DATE_FORMAT(date_time_login, '%Y-%m-%d %H:%i:%s') AS date_time_login,
      browser,
      os
    FROM sesiones
    WHERE user_uuid = ?
    ORDER BY date_time_login DESC
  `;
  pool.query(query, [user_uuid], (err, results) => {
    if (err) {
      console.error('Error obteniendo sesiones:', err);
      return res.status(500).json({ error: 'Error al obtener sesiones' });
    }
    res.json(results);
  });
});

// [8] Endpoint para cambiar la contraseña
app.post('/api/change-password', (req, res) => {
  const { user_uuid, currentPassword, newPassword } = req.body;
  if (!user_uuid || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }
  const checkPasswordQuery = 'SELECT password FROM users WHERE uuid = ?';
  pool.query(checkPasswordQuery, [user_uuid], (err, result) => {
    if (err) {
      console.error('Error al verificar la contraseña:', err);
      return res.status(500).json({ error: 'Error al verificar la contraseña' });
    }
    const user = result[0];
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    bcrypt.compare(currentPassword, user.password, (err2, isMatch) => {
      if (err2) {
        console.error('Error comparando contraseñas:', err2);
        return res.status(500).json({ error: 'Error al comparar contraseñas' });
      }
      if (!isMatch) {
        return res.status(400).json({ error: 'Contraseña actual incorrecta' });
      }
      bcrypt.hash(newPassword, 10, (err3, hashedPassword) => {
        if (err3) {
          console.error('Error al hashear la contraseña:', err3);
          return res.status(500).json({ error: 'Error al hashear la contraseña' });
        }
        const updatePasswordQuery = 'UPDATE users SET password = ? WHERE uuid = ?';
        pool.query(updatePasswordQuery, [hashedPassword, user_uuid], (err4) => {
          if (err4) {
            console.error('Error al actualizar la contraseña:', err4);
            return res.status(500).json({ error: 'Error al actualizar la contraseña' });
          }
          return res.json({ message: 'Contraseña actualizada correctamente' });
        });
      });
    });
  });
});

// [GET] Endpoint para productos
app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM products';
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error obteniendo productos:', err);
      return res.status(500).json({ error: 'Error obteniendo productos' });
    }
    res.json(results);
  });
});

// [9] Endpoint para obtener departamentos
app.get('/api/departments', (req, res) => {
  const query = 'SELECT id, name FROM departamentos';
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error obteniendo los departamentos:', err);
      return res.status(500).json({ error: 'Error obteniendo los departamentos' });
    }
    res.json(results);
  });
});

// [10] Endpoint para obtener ciudades de un departamento
app.get('/api/cities/:departmentId', (req, res) => {
  const { departmentId } = req.params;
  const query = 'SELECT id, nombre FROM ciudades WHERE departamento_id = ?';
  pool.query(query, [departmentId], (err, results) => {
    if (err) {
      console.error('Error obteniendo las ciudades:', err);
      return res.status(500).json({ error: 'Error al obtener ciudades' });
    }
    res.json(results);
  });
});

// ============================
//  POST: Crear un cliente
// ============================
app.post('/api/clients', (req, res) => {
  const {
    name,
    lastName,
    phone,
    email,
    identification,
    address1,
    address2,
    department,
    city,
    user_uuid
  } = req.body;

  console.log('Recibiendo datos para nuevo cliente:', {
    name, lastName, phone, email, identification, address1, address2, department, city, user_uuid
  });

  if (!name || !lastName || !phone || !email || !user_uuid) {
    console.error('Faltan campos obligatorios o user_uuid.');
    return res.status(400).json({ error: 'Faltan campos obligatorios o user_uuid.' });
  }

  console.log('User UUID recibido:', user_uuid);

  const checkQuery = `SELECT COUNT(*) AS count FROM clientes WHERE correo = ?`;
  pool.query(checkQuery, [email], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error verificando correo:', checkErr);
      return res.status(500).json({ error: 'Error al verificar el correo.' });
    }
    console.log('Resultado de la verificación del correo:', checkResults[0]);
    if (checkResults[0].count > 0) {
      console.error('El correo ya está en uso.');
      return res.status(400).json({ error: 'El correo ya está en uso. Use otro.' });
    }

    const insertClientQuery = `
      INSERT INTO clientes (
        nombre, 
        apellido, 
        telefono, 
        correo, 
        identificacion, 
        direccion1, 
        direccion2, 
        departamento_id, 
        ciudad_id,
        user_uuid,
        fecha_registro
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    pool.query(
      insertClientQuery,
      [
        name,
        lastName,
        phone,
        email,
        identification,
        address1,
        address2,
        department,
        city,
        user_uuid
      ],
      (err2, result) => {
        if (err2) {
          console.error('Error al insertar cliente:', err2);
          return res.status(500).json({ error: 'Error al insertar cliente' });
        }
        console.log('Cliente insertado correctamente, ID:', result.insertId);
        return res.json({
          message: 'Cliente insertado correctamente',
          clientId: result.insertId,
        });
      }
    );
  });
});

// ============================
//  GET: Obtener clientes
// ============================
app.get('/api/clients', (req, res) => {
  const { user_uuid } = req.query;
  if (!user_uuid) {
    return res.status(400).json({ error: 'Se requiere user_uuid' });
  }
  const query = `
    SELECT 
      c.id,
      c.nombre,
      c.apellido,
      c.telefono,
      c.correo,
      c.identificacion,
      c.direccion1,
      c.direccion2,
      c.departamento_id,
      c.ciudad_id,
      c.fecha_registro,
      d.name AS department_name,
      ci.nombre AS city_name,
      u.first_name AS user_first_name,
      u.last_name AS user_last_name
    FROM clientes c
    LEFT JOIN departamentos d ON c.departamento_id = d.id
    LEFT JOIN ciudades ci ON c.ciudad_id = ci.id
    LEFT JOIN users u ON c.user_uuid = u.uuid
    WHERE c.user_uuid = ?
    ORDER BY c.id DESC
  `;
  pool.query(query, [user_uuid], (err, results) => {
    if (err) {
      console.error('Error obteniendo clientes:', err);
      return res.status(500).json({ error: 'Error al obtener clientes' });
    }
    res.json(results);
  });
});

// ============================
//  PUT: Actualizar un cliente
// ============================
app.put('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    apellido,
    telefono,
    correo,
    identificacion,
    direccion1,
    direccion2,
    departamento_id,
    ciudad_id
  } = req.body;
  const updateQuery = `
    UPDATE clientes 
    SET 
      nombre = ?, 
      apellido = ?, 
      telefono = ?, 
      correo = ?, 
      identificacion = ?, 
      direccion1 = ?, 
      direccion2 = ?, 
      departamento_id = ?, 
      ciudad_id = ?
    WHERE id = ?
  `;
  pool.query(
    updateQuery,
    [
      nombre,
      apellido,
      telefono,
      correo,
      identificacion,
      direccion1,
      direccion2,
      departamento_id,
      ciudad_id,
      id
    ],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.error('Error actualizando cliente (correo duplicado):', err);
          return res.status(400).json({ error: 'El correo ya está en uso. Use otro.' });
        }
        console.error('Error updating client:', err);
        return res.status(500).json({ error: 'Error al actualizar cliente' });
      }
      return res.json({ message: 'Cliente actualizado correctamente' });
    }
  );
});

// ============================
//  DELETE: Eliminar un cliente
// ============================
app.delete('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM clientes WHERE id = ?';
  pool.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al borrar cliente:', err);
      return res.status(500).json({ error: 'Error al borrar cliente' });
    }
    return res.json({ message: 'Cliente borrado correctamente' });
  });
});

// ============================
//  GET: Obtener sesiones
// ============================
app.get('/api/sessions', (req, res) => {
  const { user_uuid } = req.query;
  if (!user_uuid) {
    return res.status(400).json({ error: 'Falta user_uuid' });
  }
  const query = `
    SELECT 
      id,
      user_uuid,
      DATE_FORMAT(date_time_login, '%Y-%m-%d %H:%i:%s') AS date_time_login,
      browser,
      os
    FROM sesiones
    WHERE user_uuid = ?
    ORDER BY date_time_login DESC
  `;
  pool.query(query, [user_uuid], (err, results) => {
    if (err) {
      console.error('Error obteniendo sesiones:', err);
      return res.status(500).json({ error: 'Error al obtener sesiones' });
    }
    res.json(results);
  });
});

// [8] Endpoint para cambiar la contraseña
app.post('/api/change-password', (req, res) => {
  const { user_uuid, currentPassword, newPassword } = req.body;
  if (!user_uuid || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }
  const checkPasswordQuery = 'SELECT password FROM users WHERE uuid = ?';
  pool.query(checkPasswordQuery, [user_uuid], (err, result) => {
    if (err) {
      console.error('Error al verificar la contraseña:', err);
      return res.status(500).json({ error: 'Error al verificar la contraseña' });
    }
    const user = result[0];
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    bcrypt.compare(currentPassword, user.password, (err2, isMatch) => {
      if (err2) {
        console.error('Error comparando contraseñas:', err2);
        return res.status(500).json({ error: 'Error al comparar contraseñas' });
      }
      if (!isMatch) {
        return res.status(400).json({ error: 'Contraseña actual incorrecta' });
      }
      bcrypt.hash(newPassword, 10, (err3, hashedPassword) => {
        if (err3) {
          console.error('Error al hashear la contraseña:', err3);
          return res.status(500).json({ error: 'Error al hashear la contraseña' });
        }
        const updatePasswordQuery = 'UPDATE users SET password = ? WHERE uuid = ?';
        pool.query(updatePasswordQuery, [hashedPassword, user_uuid], (err4) => {
          if (err4) {
            console.error('Error al actualizar la contraseña:', err4);
            return res.status(500).json({ error: 'Error al actualizar la contraseña' });
          }
          return res.json({ message: 'Contraseña actualizada correctamente' });
        });
      });
    });
  });
});

// [GET] Endpoint para productos
app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM products';
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error obteniendo productos:', err);
      return res.status(500).json({ error: 'Error obteniendo productos' });
    }
    res.json(results);
  });
});

// [9] Endpoint para obtener departamentos
app.get('/api/departments', (req, res) => {
  const query = 'SELECT id, name FROM departamentos';
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error obteniendo los departamentos:', err);
      return res.status(500).json({ error: 'Error obteniendo los departamentos' });
    }
    res.json(results);
  });
});

// [10] Endpoint para obtener ciudades de un departamento
app.get('/api/cities/:departmentId', (req, res) => {
  const { departmentId } = req.params;
  const query = 'SELECT id, nombre FROM ciudades WHERE departamento_id = ?';
  pool.query(query, [departmentId], (err, results) => {
    if (err) {
      console.error('Error obteniendo las ciudades:', err);
      return res.status(500).json({ error: 'Error al obtener ciudades' });
    }
    res.json(results);
  });
});

// ============================
//  POST: Crear un cliente
// ============================
app.post('/api/clients', (req, res) => {
  const {
    name,
    lastName,
    phone,
    email,
    identification,
    address1,
    address2,
    department,
    city,
    user_uuid
  } = req.body;

  console.log('Recibiendo datos para nuevo cliente:', {
    name, lastName, phone, email, identification, address1, address2, department, city, user_uuid
  });

  if (!name || !lastName || !phone || !email || !user_uuid) {
    console.error('Faltan campos obligatorios o user_uuid.');
    return res.status(400).json({ error: 'Faltan campos obligatorios o user_uuid.' });
  }

  console.log('User UUID recibido:', user_uuid);

  const checkQuery = `SELECT COUNT(*) AS count FROM clientes WHERE correo = ?`;
  pool.query(checkQuery, [email], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error verificando correo:', checkErr);
      return res.status(500).json({ error: 'Error al verificar el correo.' });
    }
    console.log('Resultado de la verificación del correo:', checkResults[0]);
    if (checkResults[0].count > 0) {
      console.error('El correo ya está en uso.');
      return res.status(400).json({ error: 'El correo ya está en uso. Use otro.' });
    }

    const insertClientQuery = `
      INSERT INTO clientes (
        nombre, 
        apellido, 
        telefono, 
        correo, 
        identificacion, 
        direccion1, 
        direccion2, 
        departamento_id, 
        ciudad_id,
        user_uuid,
        fecha_registro
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    pool.query(
      insertClientQuery,
      [
        name,
        lastName,
        phone,
        email,
        identification,
        address1,
        address2,
        department,
        city,
        user_uuid
      ],
      (err2, result) => {
        if (err2) {
          console.error('Error al insertar cliente:', err2);
          return res.status(500).json({ error: 'Error al insertar cliente' });
        }
        console.log('Cliente insertado correctamente, ID:', result.insertId);
        return res.json({
          message: 'Cliente insertado correctamente',
          clientId: result.insertId,
        });
      }
    );
  });
});

// ============================
//  GET: Obtener clientes
// ============================
app.get('/api/clients', (req, res) => {
  const { user_uuid } = req.query;
  if (!user_uuid) {
    return res.status(400).json({ error: 'Se requiere user_uuid' });
  }
  const query = `
    SELECT 
      c.id,
      c.nombre,
      c.apellido,
      c.telefono,
      c.correo,
      c.identificacion,
      c.direccion1,
      c.direccion2,
      c.departamento_id,
      c.ciudad_id,
      c.fecha_registro,
      d.name AS department_name,
      ci.nombre AS city_name,
      u.first_name AS user_first_name,
      u.last_name AS user_last_name
    FROM clientes c
    LEFT JOIN departamentos d ON c.departamento_id = d.id
    LEFT JOIN ciudades ci ON c.ciudad_id = ci.id
    LEFT JOIN users u ON c.user_uuid = u.uuid
    WHERE c.user_uuid = ?
    ORDER BY c.id DESC
  `;
  pool.query(query, [user_uuid], (err, results) => {
    if (err) {
      console.error('Error obteniendo clientes:', err);
      return res.status(500).json({ error: 'Error al obtener clientes' });
    }
    res.json(results);
  });
});

// ============================
//  PUT: Actualizar un cliente
// ============================
app.put('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const {
    nombre,
    apellido,
    telefono,
    correo,
    identificacion,
    direccion1,
    direccion2,
    departamento_id,
    ciudad_id
  } = req.body;
  const updateQuery = `
    UPDATE clientes 
    SET 
      nombre = ?, 
      apellido = ?, 
      telefono = ?, 
      correo = ?, 
      identificacion = ?, 
      direccion1 = ?, 
      direccion2 = ?, 
      departamento_id = ?, 
      ciudad_id = ?
    WHERE id = ?
  `;
  pool.query(
    updateQuery,
    [
      nombre,
      apellido,
      telefono,
      correo,
      identificacion,
      direccion1,
      direccion2,
      departamento_id,
      ciudad_id,
      id
    ],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.error('Error actualizando cliente (correo duplicado):', err);
          return res.status(400).json({ error: 'El correo ya está en uso. Use otro.' });
        }
        console.error('Error updating client:', err);
        return res.status(500).json({ error: 'Error al actualizar cliente' });
      }
      return res.json({ message: 'Cliente actualizado correctamente' });
    }
  );
});

// ============================
//  DELETE: Eliminar un cliente
// ============================
app.delete('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM clientes WHERE id = ?';
  pool.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al borrar cliente:', err);
      return res.status(500).json({ error: 'Error al borrar cliente' });
    }
    return res.json({ message: 'Cliente borrado correctamente' });
  });
});

// ============================
//  GET: Obtener sesiones
// ============================
app.get('/api/sessions', (req, res) => {
  const { user_uuid } = req.query;
  if (!user_uuid) {
    return res.status(400).json({ error: 'Falta user_uuid' });
  }
  const query = `
    SELECT 
      id,
      user_uuid,
      DATE_FORMAT(date_time_login, '%Y-%m-%d %H:%i:%s') AS date_time_login,
      browser,
      os
    FROM sesiones
    WHERE user_uuid = ?
    ORDER BY date_time_login DESC
  `;
  pool.query(query, [user_uuid], (err, results) => {
    if (err) {
      console.error('Error obteniendo sesiones:', err);
      return res.status(500).json({ error: 'Error al obtener sesiones' });
    }
    res.json(results);
  });
});


// [8] Endpoint para cambiar la contraseña
app.post('/api/change-password', (req, res) => {
  const { user_uuid, currentPassword, newPassword } = req.body;
  if (!user_uuid || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }
  const checkPasswordQuery = 'SELECT password FROM users WHERE uuid = ?';
  pool.query(checkPasswordQuery, [user_uuid], (err, result) => {
    if (err) {
      console.error('Error al verificar la contraseña:', err);
      return res.status(500).json({ error: 'Error al verificar la contraseña' });
    }
    const user = result[0];
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    bcrypt.compare(currentPassword, user.password, (err2, isMatch) => {
      if (err2) {
        console.error('Error comparando contraseñas:', err2);
        return res.status(500).json({ error: 'Error al comparar contraseñas' });
      }
      if (!isMatch) {
        return res.status(400).json({ error: 'Contraseña actual incorrecta' });
      }
      bcrypt.hash(newPassword, 10, (err3, hashedPassword) => {
        if (err3) {
          console.error('Error al hashear la contraseña:', err3);
          return res.status(500).json({ error: 'Error al hashear la contraseña' });
        }
        const updatePasswordQuery = 'UPDATE users SET password = ? WHERE uuid = ?';
        pool.query(updatePasswordQuery, [hashedPassword, user_uuid], (err4) => {
          if (err4) {
            console.error('Error al actualizar la contraseña:', err4);
            return res.status(500).json({ error: 'Error al actualizar la contraseña' });
          }
          return res.json({ message: 'Contraseña actualizada correctamente' });
        });
      });
    });
  });
});

// [GET] Endpoint para productos
app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM products';
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error obteniendo productos:', err);
      return res.status(500).json({ error: 'Error obteniendo productos' });
    }
    res.json(results);
  });
});

// [9] Endpoint para obtener departamentos
app.get('/api/departments', (req, res) => {
  const query = 'SELECT id, name FROM departamentos';
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Error obteniendo los departamentos:', err);
      return res.status(500).json({ error: 'Error obteniendo los departamentos' });
    }
    res.json(results);
  });
});

// [10] Endpoint para obtener ciudades de un departamento
app.get('/api/cities/:departmentId', (req, res) => {
  const { departmentId } = req.params;
  const query = 'SELECT id, nombre FROM ciudades WHERE departamento_id = ?';
  pool.query(query, [departmentId], (err, results) => {
    if (err) {
      console.error('Error obteniendo las ciudades:', err);
      return res.status(500).json({ error: 'Error al obtener ciudades' });
    }
    res.json(results);
  });
});

// Crear un nuevo retiro
app.post('/api/retiros', (req, res) => {
  const {
    monto,
    banco,
    cuenta,
    user_uuid
  } = req.body;

  // Validar datos obligatorios
  if (!monto || !banco || !cuenta || !user_uuid) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  // Generar número de solicitud (puede ser un consecutivo, un random, etc.)
  const numeroSolicitud = `R${Date.now()}`; // Ejemplo: "R1678765432100"
  const fechaSolicitud = new Date();        // fecha y hora actual
  const estadoInicial = 'Pendiente';        // Estado inicial

  const insertQuery = `
    INSERT INTO retiros (
      monto, 
      banco, 
      numero_solicitud, 
      fecha_solicitud, 
      estado, 
      cuenta, 
      user_uuid
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  pool.query(
    insertQuery,
    [
      monto,
      banco,
      numeroSolicitud,
      fechaSolicitud,  // se guardará como DATETIME
      estadoInicial,
      cuenta,
      user_uuid
    ],
    (err, result) => {
      if (err) {
        console.error('Error al insertar retiro:', err);
        return res.status(500).json({ error: 'Error al insertar retiro' });
      }
      // Devolver la información del nuevo retiro
      return res.json({
        message: 'Retiro creado exitosamente',
        retiroId: result.insertId,
        numeroSolicitud,
        fechaSolicitud,
        estado: estadoInicial
      });
    }
  );
});



// Obtener lista de retiros de un usuario
app.get('/api/retiros', (req, res) => {
  const { user_uuid } = req.query;
  if (!user_uuid) {
    return res.status(400).json({ error: 'Falta user_uuid' });
  }

  const selectQuery = `
    SELECT
      id,
      monto,
      banco,
      numero_solicitud,
      fecha_solicitud,
      fecha_cierre,
      estado,
      cuenta
    FROM retiros
    WHERE user_uuid = ?
    ORDER BY fecha_solicitud DESC
  `;

  pool.query(selectQuery, [user_uuid], (err, results) => {
    if (err) {
      console.error('Error al obtener retiros:', err);
      return res.status(500).json({ error: 'Error al obtener retiros' });
    }
    return res.json(results);
  });
});



// Crear cuenta bancaria
app.post('/api/addbank', (req, res) => {
  const {
    country,
    bank,
    identification_type,
    identification_number,
    account_type,
    interbank_number,
    user_uuid
  } = req.body;

  // Validar campos
  if (!country || !bank || !identification_type || !identification_number || !account_type || !interbank_number || !user_uuid) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const insertQuery = `
    INSERT INTO addbank (
      country, 
      bank, 
      identification_type, 
      identification_number, 
      account_type, 
      interbank_number, 
      user_uuid
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  pool.query(
    insertQuery,
    [country, bank, identification_type, identification_number, account_type, interbank_number, user_uuid],
    (err, result) => {
      if (err) {
        console.error('Error al insertar cuenta bancaria:', err);
        return res.status(500).json({ error: 'Error al insertar cuenta bancaria' });
      }
      return res.json({
        message: 'Cuenta bancaria creada exitosamente',
        bankId: result.insertId
      });
    }
  );
});





// Obtener cuentas bancarias de un usuario
app.get('/api/addbank', (req, res) => {
  const { user_uuid } = req.query;
  if (!user_uuid) {
    return res.status(400).json({ error: 'Falta user_uuid' });
  }

  const selectQuery = `
    SELECT
      id,
      country,
      bank,
      identification_type,
      identification_number,
      account_type,
      interbank_number
    FROM addbank
    WHERE user_uuid = ?
    ORDER BY id DESC
  `;

  pool.query(selectQuery, [user_uuid], (err, results) => {
    if (err) {
      console.error('Error al obtener cuentas bancarias:', err);
      return res.status(500).json({ error: 'Error al obtener cuentas bancarias' });
    }
    return res.json(results);
  });
});



app.get('/api/carriers', (req, res) => {
  const { user_uuid } = req.query;
  if (!user_uuid) {
    return res.status(400).json({ error: 'Falta user_uuid' });
  }

  // Seleccionamos ordenados por carrier_order
  const query = `
    SELECT carrier_name AS name, carrier_order AS \`order\`
    FROM carriers_order
    WHERE user_uuid = ?
    ORDER BY carrier_order ASC
  `;
  pool.query(query, [user_uuid], (err, results) => {
    if (err) {
      console.error('Error obteniendo carriers:', err);
      return res.status(500).json({ error: 'Error al obtener carriers' });
    }
    // results: [{ name: 'EVACOURIER', order: 1 }, { name: 'URBANO', order: 2 }, ...]
    return res.json(results);
  });
});




app.post('/api/carriers', (req, res) => {
  const { user_uuid, carriers } = req.body;
  // carriers: [{ name: 'EVACOURIER', order: 1 }, { name: 'URBANO', order: 2 }, ...]

  if (!user_uuid || !Array.isArray(carriers)) {
    return res.status(400).json({ error: 'Faltan datos o formato incorrecto' });
  }

  // Borramos los carriers existentes del usuario
  const deleteQuery = `DELETE FROM carriers_order WHERE user_uuid = ?`;
  pool.query(deleteQuery, [user_uuid], (delErr) => {
    if (delErr) {
      console.error('Error al borrar carriers previos:', delErr);
      return res.status(500).json({ error: 'Error al borrar carriers previos' });
    }

    // Insertamos los carriers con el nuevo orden
    const insertQuery = `
      INSERT INTO carriers_order (user_uuid, carrier_name, carrier_order)
      VALUES (?, ?, ?)
    `;
    // Construimos un array de promesas para insertar cada carrier
    const inserts = carriers.map((c) => new Promise((resolve, reject) => {
      pool.query(insertQuery, [user_uuid, c.name, c.order], (insErr) => {
        if (insErr) return reject(insErr);
        resolve(true);
      });
    }));

    // Ejecutamos todas las inserciones
    Promise.all(inserts)
      .then(() => {
        return res.json({ message: 'Carriers guardados correctamente' });
      })
      .catch((error) => {
        console.error('Error insertando carriers:', error);
        return res.status(500).json({ error: 'Error insertando carriers' });
      });
  });
});




// ──────────────────────────────────────────────────────────
// GET /api/productos
// ──────────────────────────────────────────────────────────
// Ej: /api/productos?user_uuid=xxx&busqueda=...&categoria=...
app.get('/api/productos', (req, res) => {
  const {
    busqueda,
    categoria,
    proveedor,
    precio_min,
    precio_max,
    stock_min,
    stock_max,
    user_uuid,
  } = req.query;

  let whereClauses = [];
  let values = [];

  if (busqueda) {
    whereClauses.push('nombre LIKE ?');
    values.push(`%${busqueda}%`);
  }
  if (categoria) {
    whereClauses.push('categoria = ?');
    values.push(categoria);
  }
  if (proveedor) {
    whereClauses.push('proveedor = ?');
    values.push(proveedor);
  }
  if (precio_min !== undefined && precio_min !== '') {
    whereClauses.push('precio_proveedor >= ?');
    values.push(precio_min);
  }
  if (precio_max !== undefined && precio_max !== '') {
    whereClauses.push('precio_proveedor <= ?');
    values.push(precio_max);
  }
  if (stock_min !== undefined && stock_min !== '') {
    whereClauses.push('stock >= ?');
    values.push(stock_min);
  }
  if (stock_max !== undefined && stock_max !== '') {
    whereClauses.push('stock <= ?');
    values.push(stock_max);
  }

  // Para mostrar sólo los productos de un usuario:
  if (user_uuid) {
    whereClauses.push('user_uuid = ?');
    values.push(user_uuid);
  }

  const whereString = whereClauses.length
    ? 'WHERE ' + whereClauses.join(' AND ')
    : '';

  const query = `
    SELECT
      id,
      nombre,
      categoria,
      proveedor,
      precio_proveedor,
      precio_sugerido,
      stock,
      imagen,
      user_uuid
    FROM productos
    ${whereString}
    ORDER BY id DESC
  `;

  pool.query(query, values, (err, results) => {
    if (err) {
      console.error('Error obteniendo productos:', err);
      return res.status(500).json({ error: 'Error al obtener productos' });
    }
    // Devolvemos el array (aunque sea vacío)
    res.json(results);
  });
});

// ──────────────────────────────────────────────────────────
// POST /api/productos (Crear producto con imagen opcional)
// ──────────────────────────────────────────────────────────
app.post('/api/productos', upload.single('imagen'), (req, res) => {
  try {
    const {
      nombre,
      categoria,
      proveedor,
      precio_proveedor,
      precio_sugerido,
      stock,
      user_uuid,
    } = req.body;

    // Si se subió un archivo, construimos la ruta
    let imagen = null;
    if (req.file) {
      imagen = `../../backend/public/uploads/${req.file.filename}`;
    }

    // Validar campos obligatorios
    if (
      !nombre ||
      !categoria ||
      !proveedor ||
      precio_proveedor == null ||
      precio_sugerido == null ||
      stock == null ||
      !user_uuid
    ) {
      return res.status(400).json({ error: 'Faltan campos obligatorios o user_uuid.' });
    }

    const insertQuery = `
      INSERT INTO productos (
        nombre,
        categoria,
        proveedor,
        precio_proveedor,
        precio_sugerido,
        stock,
        imagen,
        user_uuid
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    pool.query(
      insertQuery,
      [
        nombre,
        categoria,
        proveedor,
        precio_proveedor,
        precio_sugerido,
        stock,
        imagen,
        user_uuid,
      ],
      (err, result) => {
        if (err) {
          console.error('Error al insertar producto:', err);
          return res.status(500).json({ error: 'Error al insertar producto' });
        }
        return res.json({
          message: 'Producto creado exitosamente',
          id_producto: result.insertId,
          imagen,
        });
      }
    );
  } catch (error) {
    console.error('Error en POST /api/productos:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ──────────────────────────────────────────────────────────
// PUT /api/productos/:id (Actualizar con imagen opcional)
// ──────────────────────────────────────────────────────────
app.put('/api/productos/:id', upload.single('imagen'), (req, res) => {
  try {
    const {
      nombre,
      categoria,
      proveedor,
      precio_proveedor,
      precio_sugerido,
      stock,
      user_uuid,
    } = req.body;

    // Si se subió un archivo, construimos la ruta
    let imagen = null;
    if (req.file) {
      imagen = `../../backend/public/uploads/${req.file.filename}`;
    }

    if (
      !nombre ||
      !categoria ||
      !proveedor ||
      precio_proveedor == null ||
      precio_sugerido == null ||
      stock == null ||
      !user_uuid
    ) {
      return res.status(400).json({ error: 'Faltan campos obligatorios o user_uuid.' });
    }

    // Construimos la query
    let updateQuery = `
      UPDATE productos
      SET nombre = ?, categoria = ?, proveedor = ?, precio_proveedor = ?, precio_sugerido = ?, stock = ?
    `;
    const values = [
      nombre,
      categoria,
      proveedor,
      precio_proveedor,
      precio_sugerido,
      stock,
    ];

    if (imagen) {
      updateQuery += `, imagen = ?`;
      values.push(imagen);
    }

    updateQuery += ` WHERE id = ? AND user_uuid = ?`;
    values.push(req.params.id, user_uuid);

    pool.query(updateQuery, values, (err, result) => {
      if (err) {
        console.error('Error al actualizar producto:', err);
        return res.status(500).json({ error: 'Error al actualizar producto' });
      }
      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: 'Producto no encontrado o no pertenece al usuario' });
      }
      res.json({ message: 'Producto actualizado correctamente', imagen });
    });
  } catch (error) {
    console.error('Error en PUT /api/productos/:id:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ──────────────────────────────────────────────────────────
// (Opcional) DELETE /api/productos/:id
// ──────────────────────────────────────────────────────────
// Si quisieras soportar borrado
app.delete('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  const { user_uuid } = req.body || req.query; // O donde lo envíes

  if (!user_uuid) {
    return res.status(400).json({ error: 'Falta user_uuid para eliminar' });
  }

  const query = `DELETE FROM productos WHERE id = ? AND user_uuid = ?`;
  pool.query(query, [id, user_uuid], (err, result) => {
    if (err) {
      console.error('Error al eliminar producto:', err);
      return res.status(500).json({ error: 'Error al eliminar producto' });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: 'Producto no encontrado o no pertenece al usuario' });
    }
    res.json({ message: 'Producto eliminado correctamente' });
  });
});

app.get('/api/user-role', (req, res) => {
  console.log('Llamada a /api/user-role con query:', req.query);
  const { uuid } = req.query;
  if (!uuid) {
    console.error('No se recibió uuid en la query');
    return res.status(400).json({ error: 'Se requiere el UUID del usuario' });
  }

  const query = `
    SELECT users.role_id, roles.name AS role_name
    FROM users
    INNER JOIN roles ON users.role_id = roles.id
    WHERE users.uuid = ?
    LIMIT 1
  `;
  
  console.log('Ejecutando consulta con uuid:', uuid);
  pool.query(query, [uuid], (err, results) => {
    if (err) {
      console.error('Error obteniendo el rol del usuario:', err);
      return res.status(500).json({ error: 'Error al obtener el rol' });
    }
    console.log('Resultados de la consulta:', results);
    if (!results || results.length === 0) {
      console.error('Usuario no encontrado para uuid:', uuid);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    console.log('role_id del usuario:', results[0].role_id);
    res.json(results[0]); // Ejemplo: { role_id: 3, role_name: "PROVEEDOR / MARCA" }
  });
});




app.get('/api/admin-role', (req, res) => {
  const { uuid } = req.query;
  if (!uuid) {
    return res.status(400).json({ error: 'Se requiere el UUID del usuario' });
  }

  const query = `
    SELECT users.role_id, roles.name AS role_name
    FROM users
    INNER JOIN roles ON users.role_id = roles.id
    WHERE users.uuid = ? AND users.role_id = 1
    LIMIT 1
  `;

  console.log('Ejecutando consulta para ADMIN con uuid:', uuid);
  pool.query(query, [uuid], (err, results) => {
    if (err) {
      console.error('Error obteniendo el rol del usuario (ADMIN):', err);
      return res.status(500).json({ error: 'Error al obtener el rol' });
    }
    console.log('Resultados de la consulta (ADMIN):', results);
    if (results.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado o no es ADMIN' });
    }
    console.log('role_id del usuario admin:', results[0].role_id);
    res.json(results[0]);
  });
});

// ============================
// ENDPOINTS PARA LA TIENDA
// ============================

// Crear tienda
app.post('/api/stores', uploadSuppliers.single('logo'), (req, res) => {
  const { name, categories, user_uuid, user_id } = req.body;

  // Validar campos
  if (!name || !categories || !user_uuid || !user_id) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (name, categories, user_uuid, user_id).' });
  }

  // Si se subió un archivo, armamos la ruta
  let imagen = null;
  if (req.file) {
    // Ruta accesible desde frontend => /suppliers/lo_que_guarde_multer
    imagen = '../../backend/public/suppliers/' + req.file.filename;
  }

  const insertQuery = `
    INSERT INTO stores (name, categories, user_uuid, user_id, activacion, imagen, created_at)
    VALUES (?, ?, ?, ?, 1, ?, NOW())
  `;

  pool.query(
    insertQuery,
    [name, categories, user_uuid, user_id, imagen],
    (err, result) => {
      if (err) {
        console.error('Error al crear tienda:', err);
        return res.status(500).json({ error: 'Error interno al crear la tienda' });
      }
      // Devolver la tienda creada (con ID y la ruta de imagen)
      const newStoreId = result.insertId;
      const selectQuery = 'SELECT * FROM stores WHERE id = ? LIMIT 1';
      pool.query(selectQuery, [newStoreId], (err2, rows) => {
        if (err2) {
          console.error('Error al obtener la tienda creada:', err2);
          return res.status(500).json({ error: 'Error al obtener la tienda creada' });
        }
        if (rows.length === 0) {
          return res.status(404).json({ error: 'No se encontró la tienda recién creada' });
        }
        res.status(201).json(rows[0]);
      });
    }
  );
});



// Obtener todas las tiendas (o filtrar según user_uuid si así lo deseas)
app.get('/api/stores', (req, res) => {
  const { user_uuid } = req.query;

  let sql = 'SELECT * FROM stores';
  let params = [];

  if (user_uuid) {
    sql += ' WHERE user_uuid = ?';
    params.push(user_uuid);
  }

  pool.query(sql, params, (err, rows) => {
    if (err) {
      console.error('Error al obtener tiendas:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json(rows);
  });
});


// Actualizar activación de una tienda
app.put('/api/stores/:id/activacion', (req, res) => {
  const { activacion } = req.body;
  const storeId = req.params.id;

  if (![0, 1].includes(activacion)) {
    return res.status(400).json({ error: 'El estado de activación solo puede ser 0 o 1' });
  }

  const sql = 'UPDATE stores SET activacion = ? WHERE id = ?';

  pool.query(sql, [activacion, storeId], (err, result) => {
    if (err) {
      console.error('Error al actualizar activación:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
    res.json({ message: 'Estado de activación actualizado correctamente' });
  });
});


// Ejemplo de endpoint para obtener el user_id a partir de un uuid
app.get('/api/user-info', async (req, res) => {
  try {
    const { uuid } = req.query;
    if (!uuid) {
      return res.status(400).json({ error: 'Se requiere el uuid del usuario' });
    }

    // Consulta a la tabla 'users' para obtener el id y cualquier otro dato que necesites
    const query = `
      SELECT id, first_name, last_name, email, role_id
      FROM users
      WHERE uuid = ?
      LIMIT 1
    `;

    pool.query(query, [uuid], (err, results) => {
      if (err) {
        console.error('Error obteniendo el usuario por uuid:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // results[0] debería tener la fila con el id
      const userRow = results[0];
      // Retornamos un objeto con el id y lo que quieras
      return res.json({
        id: userRow.id,
        first_name: userRow.first_name,
        last_name: userRow.last_name,
        email: userRow.email,
        role_id: userRow.role_id
      });
    });
  } catch (error) {
    console.error('Error en /api/user-info:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============================
// INICIAR SERVER
// ============================
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
