import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../components/LoginView.vue';
import WaitingRoom from '../components/WaitingRoom.vue';
import QuestionView from '../components/QuestionView.vue';

const routes = [
    { path: '/', component: LoginView },
    { path: '/waiting-room', component: WaitingRoom },
    { path: '/question', component: QuestionView },
    { path: '/question-view', component: QuestionView },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
