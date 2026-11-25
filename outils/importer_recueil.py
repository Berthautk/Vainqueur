#!/usr/bin/env python3
"""Importe le recueil de prière (sources/recueil/prieres.json) dans l'application.

Produit public/content/prieres/index.json (liste légère) et un fichier par fiche.
Les textes sont copiés tels quels : aucun mot n'est modifié, résumé ni complété.
Usage : python3 -I outils/importer_recueil.py   (depuis la racine du dépôt)
"""
import json, math, os, re, sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(RACINE, 'sources', 'recueil', 'prieres.json')
SORTIE = os.path.join(RACINE, 'public', 'content', 'prieres')
MOTS_PAR_MINUTE = 130   # vitesse d'une prière dite à voix haute

# Illustrations existantes de l'application (aucune image générée), choisies selon le sujet de la fiche
IMAGES = {
    1: 'p5_09', 2: 'q1_02', 3: 'p4_11', 4: 'p5_07', 5: 'q1_01', 6: 'p2_10', 7: 'p4_01', 8: 'q1_10', 9: 'q2_10',
    10: 'p1_10', 11: 'p3_06', 12: 'q1_01', 13: 'l7_02', 14: 'l7_12', 15: 'p2_02', 16: 'p4_06', 17: 'p5_11',
    18: 'l7_11', 19: 'p3_07', 20: 'p1_05', 21: 'p1_07', 22: 'q3_04', 23: 'p2_09', 24: 'p1_07', 25: 'p4_05',
    26: 'q1_10', 27: 'p2_10', 28: 'p4_10', 29: 'p4_01', 30: 'p2_09', 31: 'l7_01', 32: 'p4_05', 33: 'p4_05',
    34: 'p4_05', 35: 'p4_05', 36: 'q3_12', 37: 'q3_12', 38: 'p1_09', 39: 'q1_04', 40: 'q1_08', 41: 'l7_04',
    42: 'l7_03', 43: 'q1_08', 64: 'p3_07', 65: 'p3_05', 66: 'p5_11',
}
for n in range(44, 51): IMAGES[n] = 'p4_05'                                         # Élie : le feu du ciel
for k, n in enumerate(range(51, 64)): IMAGES[n] = ['l7_11', 'q3_12', 'p4_01', 'l7_12'][k % 4]   # les cimes

# Série « Jour X sur 7 » par défaut (à confirmer par le ministère)
THEME = {
    'id': 'elie', 'titre': 'Bombarder comme Élie le Thischbite', 'mot_or': 'Élie le Thischbite',
    'fiches': [f'fiche-{n:02d}' for n in range(44, 51)], 'total': 7, 'debut': '2026-11-23', 'repeter': True,
    'image': 'p4_05', 'a_confirmer': True,
    '_note': "Série affichée dans « Jour X sur 7 ». « debut » = date du jour 1 ; « repeter » = la série recommence après le 7e jour. À confirmer par le ministère.",
}

def mots(items):
    return sum(len(re.findall(r"\w+", it.get('texte', ''))) for it in items)

def main():
    d = json.load(open(SOURCE, encoding='utf-8'))
    os.makedirs(SORTIE, exist_ok=True)
    index = {
        'source': d['source'], 'copyright': d['copyright'], 'parties': d['parties'], 'theme': THEME,
        'titre_page': 'Prière de délivrance et de guérison',
        'accroche_page': 'Vous ne recevez pas parce que vous demandez mal. Apprends à prier avec stratégie.',
        'fiches': [],
    }
    total = 0
    for f in d['fiches']:
        n = f['numero']
        s_matin = sum(1 for it in f['matin'] if it['type'] == 'sujet')
        s_soir = sum(1 for it in f['soir'] if it['type'] == 'sujet')
        assert s_matin + s_soir == f['nb_sujets'], f['id']
        total += f['nb_sujets']
        m_ens, m_mat, m_soi = mots(f['enseignement']), mots(f['matin']), mots(f['soir'])
        fiche = dict(f)                       # texte copié tel quel
        fiche['image'] = IMAGES[n]
        json.dump(fiche, open(os.path.join(SORTIE, f['id'] + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        index['fiches'].append({
            'id': f['id'], 'numero': n, 'partie': f['partie'], 'titre': f['titre'], 'image': IMAGES[n],
            'nb_sujets': f['nb_sujets'], 'sujets_matin': s_matin, 'sujets_soir': s_soir,
            'duree': max(1, math.ceil((m_ens + m_mat + m_soi) / MOTS_PAR_MINUTE)),
            'duree_matin': max(1, math.ceil((m_ens + m_mat) / MOTS_PAR_MINUTE)),
            'duree_soir': max(1, math.ceil((m_ens + m_soi) / MOTS_PAR_MINUTE)),
            'dans_quels_cas': bool(f.get('dans_quels_cas')),
        })
    json.dump(index, open(os.path.join(SORTIE, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f"{len(index['fiches'])} fiches, {total} sujets → {SORTIE}")

if __name__ == '__main__':
    sys.exit(main())
