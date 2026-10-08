import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, StatusBar, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const M = '#7c3aed', DARK = '#5b21b6';
const today = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [tab, setTab] = useState('home');
  const [cfg, setCfg] = useState(null);       // {host, token}
  const [tasks, setTasks] = useState([]);
  const [apps, setApps] = useState([]);
  const [st, setSt] = useState(null);
  const [online, setOnline] = useState(false);
  const [newT, setNewT] = useState('');
  const [host, setHost] = useState(''); const [token, setToken] = useState('');

  useEffect(() => { (async () => {
    const c = await AsyncStorage.getItem('cfg'); if (c) setCfg(JSON.parse(c)); else setCfg(false);
    const t = await AsyncStorage.getItem('tasks');
    if (t) { const o = JSON.parse(t); setTasks(o.day === today() ? o.items : o.items.map(i => ({ ...i, d: false }))); }
  })(); }, []);
  const saveTasks = (items) => { setTasks(items); AsyncStorage.setItem('tasks', JSON.stringify({ day: today(), items })); };

  const api = async (path, method = 'GET') => {
    const r = await fetch(`http://${cfg.host}${path}`, { method, headers: { 'X-Token': cfg.token } });
    if (r.status === 401) { await AsyncStorage.removeItem('cfg'); setCfg(false); throw 'Şifre yanlış'; }
    const j = await r.json(); if (!r.ok) throw j.detail || 'Hata'; return j;
  };

  useEffect(() => { if (!cfg) return;
    api('/api/apps').then(setApps).catch(() => {});
    const poll = () => api('/api/durum').then(s => { setSt(s); setOnline(true); }).catch(() => setOnline(false));
    poll(); const id = setInterval(poll, 1500); return () => clearInterval(id);
  }, [cfg]);

  if (cfg === null) return null;
  if (cfg === false) return (
    <SafeAreaView style={[s.fill, { backgroundColor: DARK, padding: 24, justifyContent: 'center' }]}>
      <Text style={s.h1}>PC'ye bağlan</Text>
      <Text style={{ color: '#ddd6fe', marginBottom: 16 }}>Sunucu penceresinde çıkan adresi yaz (örnek: 192.168.1.25:8000)</Text>
      <TextInput style={s.input} placeholder="192.168.1.25:8000" autoCapitalize="none" value={host} onChangeText={setHost} />
      <TextInput style={[s.input, { marginTop: 10 }]} placeholder="Şifre" autoCapitalize="none" secureTextEntry value={token} onChangeText={setToken} />
      <TouchableOpacity style={s.btn} onPress={async () => { const c = { host: host.trim(), token: token.trim() };
        await AsyncStorage.setItem('cfg', JSON.stringify(c)); setCfg(c); }}><Text style={s.btnT}>Bağlan</Text></TouchableOpacity>
    </SafeAreaView>);

  const done = tasks.filter(t => t.d).length, n = tasks.length;
  const open = (a) => api(`/api/launch/${a.id}`, 'POST').then(() => Alert.alert('Açıldı', a.ad)).catch(e => Alert.alert('Hata', String(e)));
  const fps = (p) => api(`/api/fps/${p}`, 'POST').catch(e => Alert.alert('Hata', String(e)));
  const colors = ['#7c3aed', '#059669', '#2563eb', '#ea580c'];

  const Bar = ({ v }) => <View style={s.bar}><View style={[s.barI, { width: `${v || 0}%` }]} /></View>;

  return (
    <View style={s.fill}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ backgroundColor: DARK }}>
        <View style={{ alignItems: 'center', paddingVertical: 8 }}><View style={s.logo}><Text style={{ fontWeight: '900', fontSize: 18 }}>TATS</Text></View></View>
      </SafeAreaView>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {tab === 'home' && <>
          <View style={s.hero}>
            <Text style={s.h1}>Merhaba, Atlas</Text>
            <Text style={{ color: '#ede9fe', fontSize: 17, marginVertical: 8 }}>Bugünkü çalışmalarına buradan devam edebilirsin.</Text>
            <View style={s.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View><Text style={s.lbl}>Bugünkü görevler</Text><Text style={s.big}>{n}</Text></View>
                <View style={s.net}><Text style={{ color: '#475569' }}>Tamamlama</Text><Text style={{ color: M, fontSize: 24, fontWeight: '700' }}>%{n ? Math.round(done / n * 100) : 0}</Text></View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <View style={[s.box, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}><Text style={{ color: '#047857' }}>Yapıldı</Text><Text style={[s.bn, { color: '#047857' }]}>{done}</Text></View>
                <View style={[s.box, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}><Text style={{ color: '#dc2626' }}>Kalan</Text><Text style={[s.bn, { color: '#dc2626' }]}>{n - done}</Text></View>
                <View style={[s.box, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}><Text style={{ color: '#475569' }}>PC</Text><Text style={[s.bn, { fontSize: 16, color: online ? '#047857' : '#dc2626' }]}>{online ? 'Açık' : 'Kapalı'}</Text></View>
              </View>
            </View>
          </View>
          <Text style={s.h2}>Hızlı kontrol</Text>
          <View style={s.tiles}>
            {apps.map((a, i) => (
              <TouchableOpacity key={a.id} style={[s.tile, { backgroundColor: colors[i % 4] }]} onPress={() => open(a)}>
                <Text style={{ fontSize: 34 }}>{a.tip === 'app' ? '🎮' : '🌐'}</Text>
                <Text style={s.tileT}>{a.ad}</Text>
                <Text style={{ color: '#ffffffcc' }}>{a.tip === 'app' ? "PC'de uygulamayı aç" : "PC'de siteyi aç"}</Text>
              </TouchableOpacity>))}
            {!apps.length && <Text style={{ color: '#64748b', padding: 20 }}>PC'ye bağlanılamadı</Text>}
          </View>
          <TouchableOpacity onPress={async () => { await AsyncStorage.removeItem('cfg'); setCfg(false); }}><Text style={{ textAlign: 'center', color: '#94a3b8', marginTop: 24 }}>Bağlantıyı değiştir</Text></TouchableOpacity>
        </>}

        {tab === 'prog' && <View style={{ padding: 20 }}>
          <Text style={[s.h2, { marginLeft: 0 }]}>Günlük program</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
            <TextInput style={[s.input, { flex: 1, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ddd6fe' }]} placeholder="Yeni görev ekle" value={newT} onChangeText={setNewT} />
            <TouchableOpacity style={s.add} onPress={() => { if (newT.trim()) { saveTasks([...tasks, { t: newT.trim(), d: false }]); setNewT(''); } }}><Text style={{ color: '#fff', fontSize: 16 }}>Ekle</Text></TouchableOpacity>
          </View>
          {tasks.map((t, i) => (
            <View key={i} style={s.task}>
              <TouchableOpacity onPress={() => saveTasks(tasks.map((x, k) => k === i ? { ...x, d: !x.d } : x))}><Text style={{ fontSize: 26 }}>{t.d ? '✅' : '⬜'}</Text></TouchableOpacity>
              <Text style={{ flex: 1, fontSize: 16, textDecorationLine: t.d ? 'line-through' : 'none', opacity: t.d ? 0.5 : 1 }}>{t.t}</Text>
              <TouchableOpacity onPress={() => saveTasks(tasks.filter((_, k) => k !== i))}><Text style={{ color: '#dc2626', fontSize: 24 }}>×</Text></TouchableOpacity>
            </View>))}
          {!tasks.length && <Text style={{ color: '#64748b', textAlign: 'center' }}>Henüz görev yok. Yukarıdan ekle.</Text>}
        </View>}

        {tab === 'fps' && <View style={{ padding: 20 }}>
          <Text style={[s.h2, { marginLeft: 0 }]}>FPS ve PC durumu</Text>
          <View style={s.card}>
            <Text style={{ fontSize: 80, fontWeight: '800', color: M, textAlign: 'center' }}>{st?.fps_calisiyor ? st.fps : '--'}</Text>
            <Text style={{ textAlign: 'center', color: '#64748b' }}>{st?.fps_calisiyor ? 'FPS ölçülüyor' : 'FPS kapalı'}</Text>
            <TouchableOpacity style={s.btn} onPress={() => fps('baslat')}><Text style={s.btnT}>FPS ölçümünü başlat</Text></TouchableOpacity>
            <TouchableOpacity style={[s.btn, { backgroundColor: '#64748b' }]} onPress={() => fps('durdur')}><Text style={s.btnT}>Durdur</Text></TouchableOpacity>
          </View>
          <View style={[s.card, { marginTop: 14 }]}>
            <Text>CPU %{st?.cpu ?? '-'}</Text><Bar v={st?.cpu} />
            <Text>GPU {st?.gpu == null ? '(yok)' : `%${st.gpu} · ${st.gpu_isi}°C`}</Text><Bar v={st?.gpu} />
            <Text>RAM %{st?.ram ?? '-'}</Text><Bar v={st?.ram} />
          </View>
        </View>}
      </ScrollView>

      <SafeAreaView style={s.nav}>
        <View style={{ flexDirection: 'row' }}>
          {[['home', '🏠', 'Anasayfa'], ['prog', '📋', 'Program'], ['fps', '📊', 'FPS']].map(([k, e, l]) => (
            <TouchableOpacity key={k} style={{ flex: 1, alignItems: 'center', paddingVertical: 10 }} onPress={() => setTab(k)}>
              <Text style={{ fontSize: 26, opacity: tab === k ? 1 : 0.45 }}>{e}</Text>
              <Text style={{ color: tab === k ? '#1e1b4b' : '#94a3b8', fontWeight: tab === k ? '700' : '400' }}>{l}</Text>
            </TouchableOpacity>))}
        </View>
      </SafeAreaView>
    </View>);
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#faf5ff' },
  logo: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#facc15', alignItems: 'center', justifyContent: 'center' },
  hero: { backgroundColor: M, padding: 20, paddingBottom: 28, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  h1: { color: '#fff', fontSize: 32, fontWeight: '800' },
  h2: { fontSize: 22, fontWeight: '800', color: '#1e1b4b', margin: 20, marginBottom: 12, borderLeftWidth: 5, borderLeftColor: M, paddingLeft: 10 },
  card: { backgroundColor: '#fff', borderRadius: 28, padding: 20 },
  lbl: { fontSize: 18, fontWeight: '600', color: '#334155' }, big: { fontSize: 44, fontWeight: '800', color: '#1e1b4b' },
  net: { backgroundColor: '#f3efff', borderWidth: 1.5, borderColor: '#ddd6fe', borderRadius: 20, padding: 14, alignItems: 'center' },
  box: { flex: 1, borderRadius: 18, borderWidth: 1.5, padding: 12, alignItems: 'center' }, bn: { fontSize: 24, fontWeight: '700' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 14 },
  tile: { width: '47%', minHeight: 130, borderRadius: 26, padding: 18 }, tileT: { color: '#fff', fontSize: 18, fontWeight: '700', marginVertical: 4 },
  input: { backgroundColor: '#fff', borderRadius: 14, padding: 14, fontSize: 16 },
  btn: { backgroundColor: M, borderRadius: 18, padding: 16, alignItems: 'center', marginTop: 12 }, btnT: { color: '#fff', fontSize: 17, fontWeight: '600' },
  add: { backgroundColor: M, borderRadius: 14, paddingHorizontal: 18, justifyContent: 'center' },
  task: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 10 },
  bar: { height: 10, backgroundColor: '#ede9fe', borderRadius: 6, marginTop: 6, marginBottom: 14, overflow: 'hidden' }, barI: { height: '100%', backgroundColor: M },
  nav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
});
