# 🚀 Inicio Rápido: Sistema 2FA Admin

## ⚡ Configuración en 5 minutos

### 1. Acceso al Setup
```
→ Ve a: http://localhost:3000/admin/setup
→ Contraseña: svtop2024
```

### 2. Generar 2FA
```
→ Clic en "Generar QR Code"
→ Escanea con Google Authenticator
→ Copia el secret mostrado
```

### 3. Configurar .env.local
```env
ADMIN_2FA_SECRET=TU_SECRET_COPIADO_AQUI
```

### 4. Reiniciar servidor
```bash
npm run dev
```

### 5. Login Admin
```
→ Ve a: http://localhost:3000/admin/auth
→ Usuario: svtopadmin
→ Código: [6 dígitos de Google Authenticator]
```

## 🔗 Enlaces Importantes

- **Setup inicial**: `/admin/setup` (contraseña: `svtop2024`)
- **Login 2FA**: `/admin/auth` (usuario: `svtopadmin`)
- **Dashboard**: `/admin/dashboard` (después del login)

## ⚠️ Problemas Comunes

| Problema | Solución |
|----------|----------|
| "Acceso no autorizado al setup" | Ve a `/admin/setup` e ingresa `svtop2024` |
| "2FA ya está configurado" | Elimina `ADMIN_2FA_SECRET` de `.env.local` |
| "Código 2FA inválido" | Verifica hora sincronizada y secret correcto |
| Sesión expirada | Setup: 30 min / Admin: 8 horas |

## 📱 Google Authenticator

1. Descarga la app
2. Escanea QR o ingresa secret manualmente
3. Usa código de 6 dígitos para login

---

**🔐 ¡Sistema de doble protección activado!**
- Contraseña maestra → Generar 2FA
- Google Authenticator → Acceso admin 