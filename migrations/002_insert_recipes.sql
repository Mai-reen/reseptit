-- Insert recipe data
-- NOTE: Replace 'admin-user-uuid-here' with the actual UUID of your admin user from Supabase Auth

INSERT INTO recipes (title, description, image, ingredientAmounts, categories, instructions, created_by) VALUES
(
    '牛丼',
    'x minuuttia',
    'https://upload.wikimedia.org/wikipedia/commons/4/45/Gyuu-don_001.jpg',
    ARRAY['200g udon', '200g ohut naudan suikale', '600ml dashi', '1,5rkl soijakastike', '1 rkl mirin', '1 tl sokeri', '1 tl suola'],
    ARRAY['pääruoka', 'aasialainen'],
    ARRAY['Keitä dashi, soijakastike, mirin, sokeri ja suola.', 'Paista lihat ja kevätsipuli rapeaksi pannulla.', 'Keitä nuudelit.', 'Yhdistä liemi nuudelit ja liha kulhoon'],
    'ab5d0f18-dd3f-4ad1-89f4-582afe4763f4'
),
(
    'Hot honey halloumi-pasta',
    '15 minuuttia',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRgYZRn9_QqODOVIbP-qESltgyiQaKZO6-j8Q&s',
    ARRAY['200g halloumi', '200g tuorepasta', '2dl kerma', 'chilihiutale', 'tomaattipyre', 'kasvisliemikuutio', 'hunaja', 'valkosipuli', 'valkosipulijauhe', 'pippuri'],
    ARRAY['pääruoka', 'kasvisruoka'],
    ARRAY['Kuutioi halloumi ja paista pinta rapeaksi.', 'Lisää mausteet, tomaattipyre, hunaja ja kerma.', 'Keitä pasta.'],
    'ab5d0f18-dd3f-4ad1-89f4-582afe4763f4'
),
(
    'Kasviswokki',
    '15 minuuttia',
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
    ARRAY['200g kiinankaali', '30g kevätsipuli', '2 porkkanaa', '200g munanuudeli', 'Golden&green suikale', 'sipuli', 'inkivääri', 'valkosipuli', 'soijakastike', 'valkosipulijauhe', 'kasvisfondue', 'hunaja', 'osterikastike'],
    ARRAY['pääruoka', 'kasvisruoka'],
    ARRAY['Pilko vihannekset sopivan kokoisiksi paloiksi.', 'Kuullota valkosipuli ja inkivääri seesamiöljyssä.', 'Lisää goldengreen ja paista kunnes rapeaa.', 'Lisää vihannekset ja wokkaa nopeasti korkealla lämmöllä.', 'Mausta soijakastikkeella.', 'Tarjoile heti.'],
    'ab5d0f18-dd3f-4ad1-89f4-582afe4763f4'
),
(
    'Mapo tofu',
    '15 minuuttia ja riisi',
    'https://www.marionskitchen.com/wp-content/uploads/2019/08/Mapo-Tofu4-1200x1500.jpg',
    ARRAY['200g jauheliha', '400g tofu', 'valkosipuli', 'inkivääri', '1rkl doubanjang', '2rkl mirin', '1rkl osterikastike', '1rkl soijakastike', '1tl perunajauho', 'vettä'],
    ARRAY['pääruoka', 'aasialainen'],
    ARRAY['Ruskista jauheliha ja lisää mausteet', 'Hauduta keskilämmöllä ja lisää tofu', 'Keitä riisi.'],
    'ab5d0f18-dd3f-4ad1-89f4-582afe4763f4'
),
(
    'Omenapiirakka',
    '30 min',
    'https://kotiliesi.fi/suklaapossu/wp-content/uploads/sites/12/2017/09/Mehev%C3%A4-omenapiirakka-683x1024.jpg',
    ARRAY['3 muna', '2,5dl sokeri', '100g margariini', '1,5dl maito', '4,5dl vehnäjauho', '1,5tl leivinjauhe', '3-4 omena'],
    ARRAY['jälkiruoka', 'leivonnainen'],
    ARRAY['Pane uuni kuumenemaan 225 asteeseen ja vuoraa uunipelti leivinpaperilla.', 'Kiehauta neste ja rasva.', 'Vatkaa munat ja sokeri vaahdoksi.', 'Lisää vaahtoon kuuma neste-rasvaseos ja jauhot, joihin on sekoitettu leivinjauhe.', 'Kaada taikina pellille ja lisää pinnalle omenaviipaleet', 'Paista 225°C:ssä 15-20 minuuttia.', 'Anna jäähtyä ennen tarjoilua.'],
    'ab5d0f18-dd3f-4ad1-89f4-582afe4763f4'
),
(
    'Shanghai tacot',
    '2 henkilölle, 30 minuuttia',
    'https://images.deliveryhero.io/image/fd-po/Products/1046654425.jpg?width=%s',
    ARRAY['4 sipuliparathaleipä', '200g proteiinia esim tofua tai kanaa', 'Alfalfa silmusalaatti', 'salaattisekoitus', 'paahdettu sipulirouhe', 'hoisinkastike', 'majoneesi', 'sriracha', 'limemehu'],
    ARRAY['pääruoka', 'aasialainen'],
    ARRAY['Ruskista proteiini pannulla.', 'Paista parathaleipiä hetki pannulla niin että ne ovat kullanruskeita.', 'Kasaa tacot: levitä leivälle majoneesia, hoisinkastiketta ja srirachaa, lisää salaatti, proteiini, silmusalaatti ja sipulirouhe.', 'Purista vielä päälle limemehua ja halutessasi chiliä, sekä korianteria'],
    'ab5d0f18-dd3f-4ad1-89f4-582afe4763f4'
);
