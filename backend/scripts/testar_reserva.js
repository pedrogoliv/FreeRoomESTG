async function criarReserva() {
    // Dados falsos para simular uma reserva
    const dados = {
        sala: "LAB.TESTE",
        dia: "2025-01-01",
        hora_inicio: "10:00",
        hora_fim: "12:00",
        responsavel: "Grupo SIR",
        motivo: "Teste do Backend via Script"
    };

    console.log("📨 A enviar reserva...");

    try {
        // Enviar o pedido para o teu servidor (que tem de estar a correr!)
        const resposta = await fetch('http://localhost:5000/api/reservar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();
        
        if (resposta.ok) {
            console.log("✅ SUCESSO! O servidor respondeu:", resultado);
        } else {
            console.log("❌ ERRO! O servidor rejeitou:", resultado);
        }

    } catch (erro) {
        console.log("❌ ERRO DE LIGAÇÃO! O servidor está ligado?");
        console.log(erro.message);
    }
}

criarReserva();