const firebase = require("firebase/compat/app");
require("firebase/compat/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyAxczt0_oWemuOkSbtaEvRnwd83MAEQX-s",
    authDomain: "wilpays.firebaseapp.com",
    projectId: "wilpays",
    storageBucket: "wilpays.firebasestorage.app",
    messagingSenderId: "608471336530",
    appId: "1:608471336530:web:725a5c53417799135cc18b",
    measurementId: "G-LMX4SKPFC3"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = app.firestore();

/**
 * Validate a license key against Firestore
 * @param {string} key 
 * @param {string} machineId 
 */
async function validateLicenseRemote(key, machineId) {
    try {
        const docRef = db.collection("licenses").doc(key);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return { success: false, message: "Chave de licença não encontrada." };
        }

        const data = docSnap.data();

        if (!data.active) {
            return { success: false, message: "Esta licença foi desativada pelo administrador." };
        }

        // Hardware Binding Logic
        // Checks if machine_id exists and is not an empty string
        if (data.machine_id && data.machine_id.trim() !== "") {
            if (data.machine_id !== machineId) {
                return {
                    success: false,
                    message: `Esta chave está vinculada a outro computador. (ID registado: ${data.machine_id})`
                };
            }
        } else {
            // Auto-bind machine ID on first use if not set
            try {
                console.log(`[Firebase] A vincular chave ${key} à máquina ${machineId}...`);
                await docRef.update({
                    machine_id: machineId,
                    activated_at: new Date().toISOString()
                });
                console.log("[Firebase] Vinculação concluída com sucesso.");
            } catch (e) {
                console.error("[Firebase] Erro na vinculação automática:", e.message);
                return {
                    success: false,
                    message: "Falha ao registar o seu PC no Firebase. Verifique se as 'Rules' do Firestore permitem updates. Erro: " + e.message
                };
            }
        }

        return {
            success: true,
            type: data.type || "ANNUAL",
            expires_at: data.expires_at || null
        };
    } catch (error) {
        console.error("Firebase Auth Error:", error);
        return { success: false, message: "Erro de conexão com o servidor de licenças." };
    }
}

module.exports = { validateLicenseRemote };
