package com.exemplo.ordemservico.service;

import com.exemplo.ordemservico.enums.StatusOS;
import com.exemplo.ordemservico.model.OrdemServico;
import com.exemplo.ordemservico.repository.OrdemServicoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class OrdemServicoService {

    private final OrdemServicoRepository ordemServicoRepository;
    private final ClienteService clienteService;
    private final TecnicoService tecnicoService;

    public OrdemServicoService(
            OrdemServicoRepository ordemServicoRepository,
            ClienteService clienteService,
            TecnicoService tecnicoService) {
        this.ordemServicoRepository = ordemServicoRepository;
        this.clienteService = clienteService;
        this.tecnicoService = tecnicoService;
    }

    // CONSULTAS (sem regra de negócio)
    public List<OrdemServico> listarTodas() {
        return ordemServicoRepository.findAll();
    }

    public List<OrdemServico> listarPorStatus(StatusOS status) {
        return ordemServicoRepository.findByStatus(status);
    }

    public List<OrdemServico> listarPorCliente(Long clienteId) {
        return ordemServicoRepository.findByClienteId(clienteId);
    }

    public OrdemServico buscarPorId(Long id) {
        return ordemServicoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Ordem de serviço não encontrada: " + id));
    }
}
