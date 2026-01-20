def consolidar_palavras(arquivo_origem, arquivo_adicional, arquivo_saida):
    palavras_totais = set()

    # original file load
    try:
        with open(arquivo_origem, 'r', encoding='utf-8') as f:
            for linha in f:
                palavra = linha.strip().lower()
                if palavra:
                    palavras_totais.add(palavra)
        print(f"Palavras originais carregadas: {len(palavras_totais)}")
    except FileNotFoundError:
        print(f"Aviso: {arquivo_origem} não encontrado. Criando novo set.")

    # adding additional words
    contagem_antes = len(palavras_totais)
    with open(arquivo_adicional, 'r', encoding='utf-8') as f:
        for linha in f:
            palavra = linha.strip().lower()
            if palavra:
                palavras_totais.add(palavra)
    
    novas_palavras = len(palavras_totais) - contagem_antes
    print(f"Novas palavras adicionadas: {novas_palavras}")

    # saving final list
    with open(arquivo_saida, 'w', encoding='utf-8') as f:
        for palavra in sorted(list(palavras_totais)):
            f.write(f"{palavra}\n")
            
    print(f"Processo concluído! Arquivo salvo em: {arquivo_saida}")

# run
# consolidar_palavras('en-us.txt', 'en-us-common.txt', 'en-us-final.txt')