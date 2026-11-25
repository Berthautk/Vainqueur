#!/usr/bin/env python3
"""Compare chaque référence et citation biblique du recueil avec la Bible Louis Segond 1910 de l'application.

Ne corrige rien : produit seulement sources/recueil/VERIFICATION_BIBLE.md.
Usage : python3 -I outils/verifier_bible_recueil.py   (depuis la racine du dépôt)
"""
import difflib, json, os, re, unicodedata

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(RACINE, 'sources', 'recueil', 'prieres.json')
BIBLE = os.path.join(RACINE, 'public', 'bible')
SORTIE = os.path.join(RACINE, 'sources', 'recueil', 'VERIFICATION_BIBLE.md')

def sans_accents(s):
    return unicodedata.normalize('NFD', s).encode('ascii', 'ignore').decode()

def mots(s):
    s = sans_accents(s.replace('’', "'").replace('œ', 'oe').replace('Œ', 'oe')).lower()
    return re.findall(r"[a-z0-9]+", s)

# ---------- Bible ----------
livres = json.load(open(os.path.join(BIBLE, 'livres.json'), encoding='utf-8'))['livres']
texte_livre = {}
def chapitres(lid):
    if lid not in texte_livre:
        texte_livre[lid] = json.load(open(os.path.join(BIBLE, 'lsg', lid + '.json'), encoding='utf-8'))['c']
    return texte_livre[lid]

NOMS = {}
for l in livres:
    NOMS[sans_accents(l['nom']).lower()] = l['id']
ALIAS = {'psaume': 'psaumes', 'isaie': 'esaie', 'juge': 'juges', 'proverbe': 'proverbes', 'lamentation': 'lamentations',
         'cantique': 'cantique', 'cantique des cantiques': 'cantique', 'actes des apotres': 'actes', 'apocalypses': 'apocalypse',
         'hebreu': 'hebreux', 'ephesien': 'ephesiens', 'philippien': 'philippiens', 'romain': 'romains'}
for a, i in ALIAS.items():
    NOMS[a] = i
def livre_de(nom):
    k = re.sub(r'^([123])\s*(?:er|re|e)?\s*', r'\1 ', sans_accents(nom).lower()).strip()
    k = re.sub(r'\s+', ' ', k)
    return NOMS.get(k)

noms_regex = sorted({re.escape(n) for l in livres for n in (l['nom'].split(' ', 1)[1] if l['nom'][0] in '123' else l['nom'], sans_accents(l['nom'].split(' ', 1)[1] if l['nom'][0] in '123' else l['nom']))} |
                    {'Psaume', 'Isaïe', 'Esaie', 'Juge', 'Proverbe', 'Actes des apôtres', 'Cantique'}, key=len, reverse=True)
REF = re.compile(r"(?<![\w])((?:[123]\s?(?:er|re|e)?\s)?(?:" + '|'.join(n.replace(r'\ ', r'\s+') for n in noms_regex) +
                 r"))\s+(\d{1,3})\s*[:.]\s*(\d{1,3})(?:\s*(?:-|–|à)\s*(\d{1,3}))?(?![\d])", re.I)

def verset_texte(lid, c, v1, v2):
    ch = chapitres(lid)
    if c < 1 or c > len(ch): return None
    vs = ch[c - 1]
    v2 = v2 or v1
    if v1 < 1 or v1 > len(vs): return None
    return ' '.join(vs[v - 1] for v in range(v1, min(v2, len(vs)) + 1))

def nom_ref(lid, c, v1, v2=None):
    l = next(x for x in livres if x['id'] == lid)
    return f"{'Psaume' if lid == 'psaumes' else l['nom']} {c}:{v1}{'-' + str(v2) if v2 and v2 != v1 else ''}"

# ---------- Citation autour d'une référence ----------
def citation(t, m):
    apres = t[m.end():]
    a = re.match(r"\s*[:—–,-]?\s*«\s*(.+?)\s*»", apres, re.S)
    if a: return a.group(1), 'guillemets'
    avant = t[:m.start()]
    b = re.search(r"«\s*([^«»]+?)\s*»\s*[,.;]?\s*\(?\s*$", avant, re.S)
    if b: return b.group(1), 'guillemets'
    c = re.match(r"\s*[:—–]\s*([^«»]{12,}?)(?=$|\s(?:[123]\s)?[A-ZÉ][a-zéèë]+\s\d{1,3}\s*[:.])", apres, re.S)
    if c: return c.group(1).strip(), 'sans guillemets'
    if not apres.strip(' .)') and len(avant.strip()) > 15:            # « … texte. Apocalypse 18 :8 » en fin d'élément
        d = avant.rsplit(':', 1)[-1] if ' dit que' in avant or 'dit :' in avant else avant
        return d.strip(' .(—–-'), 'sans guillemets'
    return None, None

def comparer(cit, lsg):
    q, l = mots(cit), mots(lsg)
    if not q: return 'Référence seule', ''
    ql, ll = ' '.join(q), ' '.join(l)
    parties = [mots(p) for p in re.split(r'…|\.\.\.|\(\s*…\s*\)', cit) if mots(p)]
    if ql in ll or (len(parties) > 1 and all(' '.join(p) in ll for p in parties)):
        return 'Conforme', ''
    sm = difflib.SequenceMatcher(None, q, l, autojunk=False)
    commun = sum(b.size for b in sm.get_matching_blocks())
    couverture = commun / len(q)
    diffs = []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op != 'equal' and (i2 > i1) and len(diffs) < 3:
            diffs.append(f"« {' '.join(q[i1:i2])} »" + (f" au lieu de « {' '.join(l[j1:j2])} »" if j2 > j1 and j2 - j1 < 8 else ''))
    if couverture >= 0.85: return 'Proche', '; '.join(diffs)
    if couverture >= 0.5: return 'Partiellement conforme', '; '.join(diffs)
    return 'Différente', ''

def meilleur_verset(cit, lid=None):
    """Cherche le verset dont le texte ressemble le plus à la citation (même livre d'abord, puis toute la Bible)."""
    q = set(mots(cit))
    if len(q) < 4: return None
    best = (0, None)
    for l in ([x for x in livres if x['id'] == lid] if lid else livres):
        for ci, ch in enumerate(chapitres(l['id'])):
            for vi, v in enumerate(ch):
                w = set(mots(v))
                s = len(q & w) / len(q)
                if s > best[0]: best = (s, (l['id'], ci + 1, vi + 1))
    return best if best[0] >= 0.75 else None

def main():
    d = json.load(open(SOURCE, encoding='utf-8'))
    lignes = []
    for f in d['fiches']:
        for sec in ('dans_quels_cas', 'enseignement', 'matin', 'soir'):
            for it in f.get(sec, []):
                t = it['texte']
                for m in REF.finditer(t):
                    lid = livre_de(m.group(1))
                    c, v1 = int(m.group(2)), int(m.group(3)); v2 = int(m.group(4)) if m.group(4) else None
                    ou = {'enseignement': 'Enseignement', 'dans_quels_cas': 'Dans quels cas', 'matin': 'Matin', 'soir': 'Soir'}[sec]
                    if it.get('type') == 'sujet' and it.get('numero') is not None: ou += f", sujet {it['numero']}"
                    ref_txt = re.sub(r'\s+', ' ', m.group(0))
                    if not lid:
                        lignes.append((f['numero'], ou, ref_txt, 'Livre non reconnu', '', '', '')); continue
                    lsg = verset_texte(lid, c, v1, v2)
                    if lsg is None:
                        lignes.append((f['numero'], ou, ref_txt, 'Référence introuvable', '', '', 'chapitre ou verset hors de la Bible LSG 1910')); continue
                    cit, genre = citation(t, m)
                    if not cit:
                        lignes.append((f['numero'], ou, ref_txt, 'Référence seule', '', lsg, '')); continue
                    statut, rem = comparer(cit, lsg)
                    if genre == 'sans guillemets' and statut == 'Différente':
                        statut, rem = 'Référence seule', 'texte voisin sans guillemets, non comparé comme citation'
                    if statut == 'Différente':
                        b = meilleur_verset(cit, lid) or meilleur_verset(cit)
                        if b: rem = f"le texte ressemble plutôt à {nom_ref(*b[1])} ({round(b[0] * 100)} % des mots)"
                        else: rem = 'aucun autre verset ne correspond mieux : sans doute une paraphrase ou une autre traduction (référence probablement juste)'
                    if genre == 'sans guillemets' and statut != 'Référence seule': rem = ('citation sans guillemets ; ' + rem).strip(' ;')
                    lignes.append((f['numero'], ou, ref_txt, statut, cit, lsg, rem))

    ordre = ['Référence introuvable', 'Livre non reconnu', 'Différente', 'Partiellement conforme', 'Proche', 'Conforme', 'Référence seule']
    compte = {s: sum(1 for x in lignes if x[3] == s) for s in ordre}
    court = lambda s, n: (s if len(s) <= n else s[:n].rsplit(' ', 1)[0] + '…').replace('|', '/').replace('\n', ' ')
    out = ['# Vérification des références bibliques du recueil', '',
           f"Recueil : {d['source']}. Bible de comparaison : Louis Segond 1910 (celle de l'application).", '',
           '**Rien n\'a été corrigé.** Ce document sert seulement à faire trancher le ministère.', '',
           'Méthode : chaque référence (« Livre chapitre : verset ») est retrouvée dans la LSG 1910 ; la citation qui l\'accompagne '
           '(entre guillemets juste avant ou juste après, ou à la suite de « : ») est comparée mot à mot, sans tenir compte des accents, '
           'de la ponctuation ni des majuscules.', '',
           '| Statut | Nombre | Signification |', '|---|---|---|',
           f"| Conforme | {compte['Conforme']} | La citation est exactement le texte LSG 1910 (ou une partie). |",
           f"| Proche | {compte['Proche']} | Au moins 85 % des mots identiques : petites variantes (autre édition, mot changé). |",
           f"| Partiellement conforme | {compte['Partiellement conforme']} | Entre 50 et 85 % des mots : citation libre, abrégée ou d'une autre traduction. |",
           f"| Différente | {compte['Différente']} | Moins de 50 % des mots : mauvaise référence probable (voir la piste proposée). |",
           f"| Référence introuvable | {compte['Référence introuvable']} | Le chapitre ou le verset n'existe pas dans la LSG 1910. |",
           f"| Livre non reconnu | {compte['Livre non reconnu']} | Nom de livre non reconnu. |",
           f"| Référence seule | {compte['Référence seule']} | Référence sans citation à comparer (paraphrase, renvoi). |",
           f"| **Total** | **{len(lignes)}** | |", '',
           '## À faire vérifier par le ministère', '',
           'Classées de la plus importante à la moins importante.', '']
    a_voir = [x for x in lignes if x[3] in ('Référence introuvable', 'Livre non reconnu', 'Différente', 'Partiellement conforme', 'Proche')]
    a_voir.sort(key=lambda x: (ordre.index(x[3]), x[0]))
    for (n, ou, ref, st, cit, lsg, rem) in a_voir:
        out += [f"### Fiche {n} — {ref} — {st}", f"- **Où** : {ou}"]
        if cit: out.append(f"- **Dans le recueil** : « {court(cit, 400)} »")
        if lsg: out.append(f"- **LSG 1910** : « {court(lsg, 400)} »")
        if rem: out.append(f"- **Remarque** : {rem}")
        out.append('')
    out += ['## Toutes les références', '', '| Fiche | Où | Référence | Statut |', '|---|---|---|---|']
    out += [f"| {n} | {ou} | {ref} | {st} |" for (n, ou, ref, st, *_r) in lignes]
    open(SORTIE, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print(len(lignes), 'références ;', compte, '→', SORTIE)

if __name__ == '__main__':
    main()
