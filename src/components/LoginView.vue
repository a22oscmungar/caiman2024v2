<template>
  <div class="main-div">
    <h1>BIENVENIDOS AL <br> TEST DEL CAIMÁN <br>2024</h1>
    <img src="../assets/logocaiman.png" alt="Caimán" width="200" height="200">
    <form @submit.prevent="login" class="login-container">
      <input v-model="username" placeholder="Usuario" required />
      <input type="password" v-model="password" placeholder="Contraseña" required />
      <button type="submit">Iniciar sesión</button>
    </form>
      <button class="btnHint" @click="this.showHints">
        Pistas</button>
      
    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <span class="close" @click="this.closeModal">&times;</span>
        <h3>Pistas de Contraseñas</h3>
        <ul>
          <li>Aitor:</li>
          <li>Marcos:</li>
          <li>Manel:</li>
          <li>Carla:</li>
          <li>Noa:</li>
          <li>Ana:</li>
          <li>Javier:</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  data() {
    return {
      username: '',
      password: '',
      error: null,
      showModal: false,
    };
  },
  methods: {
    async login() {
      try {
        console.log(this.username, ' ', this.password);

        const response = await fetch('http://localhost:8000/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: this.username, password: this.password }),
        });

        const data = await response.json();


        if (data.success) {
          // Redirigir a la sala de espera con el nombre de usuario como parámetro
          this.$router.push({ path: '/waiting-room', query: { username: data.username } });
        }
        else {
          this.error = data.error || 'Error desconocido';
        }
      } catch (error) {
        console.error('Error al iniciar sesión:', error);
        this.error = 'Error al iniciar sesión';
      }
    },showHints() {
      this.showModal = true;
      console.log('Mostrando pistas');
      
    },
    closeModal() {
      this.showModal = false;
    }
  },
     
};
</script>

<style scoped>
/* Estilos para el componente de login */
.main-div {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
  height: 100vh;
  background-color:bisque ; 
  border-radius: 3px solid green;
  padding: 1rem;
  box-sizing: border-box;
}

img{
  margin-bottom: 15px;
}

.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.login-container input {
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid green;
  border-radius: 10px;
  width: calc(100% - 2rem);
  max-width: 300px;
}

button {
  padding: 0.75rem;
  width: calc(100% - 2rem);
  max-width: 300px;
  background-color: green;
  color: white;
  border: none;
  font-size: 16px;
  border-radius: 10px;
  cursor: pointer;
}

.btnHint {
  background-color: green; /* Verde */
  border: none;
  color: white;
  margin-top: 25px;
  padding: 10px 10px; /* Ajuste de padding para que el texto se ajuste mejor */
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
  white-space: nowrap; /* Evita que el texto se desborde */
}


/* Estilos para el modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  padding: 30px;
  border-radius: 10px;
  width: 350px;
  max-width: 80%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  text-align: left;
  animation: fadeIn 0.3s ease-out;
}

.close {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  transition: color 0.3s;
}

.close:hover {
  color: #333;
}

ul{
  list-style-type: none;
  padding: 0;
  gap: 1rem;
}

li{  
  padding: 5px 0;
  border-bottom: 1px solid #ddd;
  font: 1em sans-serif;
}

/* Animación de entrada para el modal */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>