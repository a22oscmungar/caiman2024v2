<template>
    <div class="resultados">
        <h1>Resultados</h1>
        <ul>
            <li v-for="player in players" :key="player.username">
                <div class="todo">
                    <p class="nombre">{{ player.username }}</p> <p class="score">{{ player.score }} </p>
                </div>
            
                <span v-if="player.score > 9" class="caiman">Caiman</span>
                <span v-else-if="player.score >= 7.5" class="trucho">Trucho</span>
                <span v-else-if="player.score >= 5" class="wawawa">Wawawa</span>
                <span v-else-if="player-score >= 3.5" class="poppy">Poppy</span>
                <span v-else class="sapo">Sapo</span>
            
            </li>
        </ul>

    </div>
</template>

<script>
export default {
    data() {
        return {
            username: this.$route.query.username,
            players: []
        }
    },
    async created() {
        try {
            const response = await fetch('http://localhost:8000/getPlayers');
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.statusText}`);
            }
            const data = await response.json();
            console.log(data);
            this.players = data.players;
        } catch (err) {
            console.error('Error al obtener los players:', err);
        }
    },
}
</script>

<style>
 .resultados {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    min-height: 100vh;
    background-color: bisque;
    text-align: center;
    overflow: hidden; /* Evita el scroll en el contenedor principal */
}

h1 {
    font-size: 3.5rem;
    color: #2a6b2c;
    margin: 0;
    padding: 10px;
    background-color: bisque;
    position: sticky; /* Hace que el título permanezca visible */
    top: 0; /* Lo fija en la parte superior */
    z-index: 10; /* Asegura que esté sobre otros elementos */
}

ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
    width: 100%; /* Asegura que ocupe el ancho del contenedor */
    max-height: calc(100vh - 5rem); /* Resta el espacio ocupado por el título */
    overflow-y: auto; /* Habilita el scroll vertical */
}

li {
    margin-bottom: 10px;
}

.todo {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    border-bottom: 1px solid #ccc;
}

.nombre {
    font-size: 1.5rem;
    font-weight: bold;
}

.caiman {
    color: #2a6b2c;
    font-weight: bold;
}

.trucho {
    color: rgb(131, 17, 131);
    font-weight: bold;
}

.wawawa {
    color: #143764;
    font-weight: bold;
}

.poppy {
    color: #582232;
    font-weight: bold;
}

.sapo {
    color: #1a1616;
    font-weight: bold;
}

</style>