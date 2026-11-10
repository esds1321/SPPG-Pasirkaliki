"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import Image from "next/image";

const initial = ["", "", "", "", "", "", "", "", ""];

type Entry = {
  id: string;
  name: string;
  date: string;
};

export default function Home() {
  const [names, setNames] = useState<string[]>(initial);
  const [records, setRecords] = useState<Entry[]>([]);
  const [winner, setWinner] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [excludeWinners, setExcludeWinners] = useState(false);
  const [notification, setNotification] = useState("");

  const participants = names.map((name) => name.trim()).filter(Boolean);
  const pastWinners = records.map((r) => r.name.toLowerCase());
  const eligibleParticipants = participants.filter((name) => {
    if (!excludeWinners) return true;
    return !pastWinners.includes(name.toLowerCase());
  });

  useEffect(() => {
    try {
      const savedNames = localStorage.getItem("gw_names");
      const savedHistory = localStorage.getItem("gw_history");
      const savedTheme = localStorage.getItem("gw_theme");
      const savedExclude = localStorage.getItem("gw_exclude");

      if (savedNames) {
        const parsed = JSON.parse(savedNames);
        if (Array.isArray(parsed)) {
          setNames([...parsed.slice(0, 9), ...Array(9).fill("")].slice(0, 9));
        }
      }

      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) setRecords(parsed);
      }

      if (savedExclude !== null) {
        setExcludeWinners(JSON.parse(savedExclude));
      }

      if (
        savedTheme === "dark" ||
        (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        setDarkMode(true);
        document.documentElement.classList.add("dark");
      }
    } catch (error) {
      console.error("Gagal memuat data:", error);
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("gw_names", JSON.stringify(names));
    localStorage.setItem("gw_history", JSON.stringify(records));
    localStorage.setItem("gw_exclude", JSON.stringify(excludeWinners));
  }, [names, records, excludeWinners, loaded]);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("gw_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("gw_theme", "light");
      }
      return next;
    });
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification("");
    }, 3000);
  };

  const getSecureRandomInt = (max: number) => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  };

  const draw = () => {
    const list = excludeWinners ? eligibleParticipants : participants;

    if (participants.length < 2) {
      alert("Minimal masukkan 2 nama peserta untuk melakukan draw.");
      return;
    }

    if (excludeWinners && list.length === 0) {
      alert("Semua peserta sudah pernah menang! Reset riwayat atau matikan opsi 'Cegah Pemenang Berulang'.");
      return;
    }

    if (drawing) return;

    setWinner("");
    setDrawing(true);

    let i = 0;

    const timer = setInterval(() => {
      const randomName = participants[getSecureRandomInt(participants.length)];
      setWinner(randomName);

      if (++i >= 30) {
        clearInterval(timer);
        const selectedWinner = list[getSecureRandomInt(list.length)];
        setWinner(selectedWinner);

        setRecords((old) => [
          {
            id: crypto.randomUUID(),
            name: selectedWinner,
            date: new Date().toLocaleString("id-ID"),
          },
          ...old,
        ]);

        setDrawing(false);
      }
    }, 80);
  };

  // Fungsi Share Teks Pengumuman ke WhatsApp dengan format baru
  const shareToWhatsApp = () => {
    if (!winner) return;
    const tanggalHariIni = new Date().toLocaleDateString("id-ID");
    const message = encodeURIComponent(
      `🏆 *PENGUMUMAN HASIL DRAW Backup  Devisi Kebersihan*\n` +
      `TANGGAL ${tanggalHariIni}\n\n` +
      `Selamat kepada:\n` +
      `👑 *${winner}*\n\n` +
      `Terima kasih atas partisipasi semuanya!\n` +
      `BAGI YANG BELUM MENANG BISA MENDAFTAR KEMBALI JIKA SLOT DRAW MASIH ADA DI HARI BERIKUTNYA.\n` +
      `\n*Berikut  list kerjanya*\n` +
      `\nNo.Area pemeriksaan Status\n` +
      `\n1 Area dapur bersih 📝\n` +
      `\n2 Lantai bersih dan tidak licin 📝\n` +
      `\n3 Meja kerja bersih 📝\n` +
      `\n4 Area pencucian bersih 📝\n` +
      `\n5 Toilet bersih 📝\n` +
      `\n6 Tempat sampah tidak penuh 📝\n` +
      `\n7 Saluran pembuangan lancar 📝\n` +
      `\n8 Area pengemasan bersih 📝\n` +
      `\n9 Peralatan kebersihan tersimpan rapi 📝\n` +
      `\n10 Tidak ditemukan tanda-tanda hama 📝\n` +
      `\n*SPPG Wibawa Pasirkaliki Karawang*\n`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, "_blank");
  };

  const exportWinnersExcel = () => {
    if (!records.length) {
      showNotification("⚠️ Belum ada riwayat pemenang untuk diunduh!");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(
      records.map((item, index) => ({
        No: index + 1,
        "Nama Pemenang": item.name,
        "Tanggal & Waktu": item.date,
      }))
    );

    ws["!cols"] = [{ wch: 8 }, { wch: 25 }, { wch: 28 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Riwayat Pemenang");
    XLSX.writeFile(wb, "riwayat-pemenang.xlsx");

    showNotification("✅ Berhasil mengunduh riwayat pemenang (riwayat-pemenang.xlsx)");
  };

  const exportAllParticipantsExcel = () => {
    if (!participants.length) {
      showNotification("⚠️ Belum ada data peserta untuk diexport!");
      return;
    }

    const exportData = participants.map((name, index) => {
      const matchedRecord = records.find(
        (r) => r.name.toLowerCase() === name.toLowerCase()
      );
      return {
        No: index + 1,
        "Nama Peserta": name,
        Status: matchedRecord ? "MENANG (WINNER)" : "BELUM MENANG",
        "Tanggal & Waktu Menang": matchedRecord ? matchedRecord.date : "-",
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws["!cols"] = [{ wch: 6 }, { wch: 25 }, { wch: 20 }, { wch: 28 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Status Peserta");
    XLSX.writeFile(wb, "status-peserta-gacha.xlsx");

    showNotification("✅ Berhasil mengunduh status peserta (status-peserta-gacha.xlsx)");
  };

  const clearHistory = () => {
    if (!records.length) {
      showNotification("⚠️ Riwayat pemenang sudah kosong!");
      return;
    }

    setRecords([]);
    showNotification("🗑️ Seluruh riwayat pemenang berhasil dihapus!");
  };

  const shuffle = () => {
    setNames((old) => {
      const filled = old.filter((name) => name.trim());
      const empty = old.filter((name) => !name.trim());

      for (let i = filled.length - 1; i > 0; i--) {
        const j = getSecureRandomInt(i + 1);
        [filled[i], filled[j]] = [filled[j], filled[i]];
      }

      return [...filled, ...empty];
    });
  };

  const reset = () => {
    const hasNames = names.some((name) => name.trim() !== "");
    if (!hasNames) {
      showNotification("⚠️ Daftar nama peserta sudah kosong!");
      return;
    }

    setNames([...initial]);
    setWinner("");
    showNotification("🔄 Seluruh nama peserta berhasil direset!");
  };

  return (
    <main className="shell">
      {notification && (
        <div className="toast-notification">
          {notification}
        </div>
      )}

      <header className="site-header">
        <a className="logo" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Image 
            src="/BGN.png" 
            alt="Logo SPPG" 
            width={28} 
            height={28} 
            style={{ objectFit: "contain", borderRadius: "4px" }}
          />
          <span>SPPG Wibawa Pasirkaliki <b>WORK</b></span>
        </a>

        <div className="header-right">
          <div className="tag">
            {participants.length}/9 · 1 SELECTED
          </div>
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title="Ganti Mode Terang/Gelap"
          >
            {darkMode ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>
        </div>
      </header>

      <section className="hero">
        <small>SECURE DRAW SYSTEM</small>
        <h1>
          Who will be the <b>Selected?</b>
        </h1>
        <p>Sistem pengundian ketat dengan enkripsi acak dan filter riwayat.</p>
      </section>

      <div className="grid">
        <section className="panel participants-panel">
          <div className="over">/ PARTICIPANTS</div>

          <h2>Daftar peserta</h2>

          <p className="muted">
            Masukkan minimal 2 nama. Kolom kosong tidak akan ikut undian.
          </p>

          <div className="names">
            {names.map((name, index) => (
              <label key={index}>
                <small>{String(index + 1).padStart(2, "0")}</small>

                <input
                  value={name}
                  maxLength={80}
                  placeholder={`Nama peserta ${index + 1}`}
                  disabled={drawing}
                  onChange={(event) => {
                    setNames((old) =>
                      old.map((item, i) =>
                        i === index ? event.target.value : item
                      )
                    );
                  }}
                />
              </label>
            ))}
          </div>

          <div className="actions">
            <button
              onClick={() => {
                localStorage.setItem("gw_names", JSON.stringify(names));
                showNotification("💾 Daftar nama peserta berhasil disimpan!");
              }}
            >
              ✓ Simpan nama
            </button>

            <button onClick={shuffle} disabled={drawing}>
              ⤨ Acak urutan
            </button>

            <button className="quiet" onClick={reset} disabled={drawing}>
              Reset
            </button>
          </div>

          <div className="strict-setting">
            <label>
              <input
                type="checkbox"
                checked={excludeWinners}
                onChange={(e) => setExcludeWinners(e.target.checked)}
              />
              <span>🔒 <b>Mode Ketat:</b> Cegah pemenang lama menang lagi</span>
            </label>
          </div>

          <p className="footnote">
            {excludeWinners
              ? `${eligibleParticipants.length} peserta tersisa yang belum pernah menang.`
              : `${participants.length} peserta siap mengikuti undian.`}
          </p>
        </section>

        <section className="panel draw-panel">
          <div className="over">/ THE DRAW</div>

          <h2>Pengundian</h2>

          <div
            className={
              "stage " +
              (drawing ? "spin" : "") +
              (winner && !drawing ? " won" : "")
            }
          >
            <small>
              {winner && !drawing ? "THE WINNER IS" : "READY TO REVEAL"}
            </small>

            <div className="winner">{winner || "?"}</div>

            {winner && !drawing ? (
              <div className="badge">🏆 PEMENANG TERPILIH</div>
            ) : (
              <p>
                {drawing
                  ? "Mengamankan hasil acak kriptografi..."
                  : `Satu nama akan terpilih secara adil dari ${excludeWinners ? eligibleParticipants.length : participants.length} peserta.`}
              </p>
            )}

            {/* Tombol Share ke WhatsApp */}
            {winner && !drawing && (
              <button
                onClick={shareToWhatsApp}
                style={{
                  marginTop: "1rem",
                  background: "#25D366",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.6rem 1rem",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  width: "100%",
                  boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)",
                  transition: "transform 0.2s ease"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                Share Pengumuman ke WhatsApp
              </button>
            )}
          </div>

          <button
            className="draw"
            disabled={drawing || participants.length < 2 || (excludeWinners && eligibleParticipants.length === 0)}
            onClick={draw}
          >
            {drawing ? "SECURED DRAWING..." : "🎲 SECURE DRAW 1 WINNER ↗"}
          </button>

          {participants.length < 2 && (
            <p className="footnote center">
              Minimal 2 peserta diperlukan untuk memulai draw.
            </p>
          )}

          <button className="export" onClick={exportWinnersExcel}>
            ⇩ Download Riwayat Pemenang (.xlsx)
          </button>

          <p className="footnote center">
            Didukung oleh enkripsi acak tingkat browser untuk keadilan maksimal.
          </p>
        </section>
      </div>

      <section className="panel history">
        <div className="over">/ RECORDS</div>

        <div className="histhead">
          <div className="hist-top">
            <h2>
              Riwayat pemenang <span>{records.length}</span>
            </h2>
          </div>

          <div className="actions" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
            <button onClick={exportWinnersExcel}>⇩ Export Pemenang</button>
            <button onClick={exportAllParticipantsExcel}>⇩ Export Status (Menang & Belum)</button>
            
            <button
              className="quiet"
              onClick={clearHistory}
            >
              Hapus riwayat
            </button>
          </div>
        </div>

        {!records.length ? (
          <div className="empty">
            ♧
            <strong>Belum ada hasil draw</strong>
            <p>Nama pemenang akan tampil setelah pengundian.</p>
          </div>
        ) : (
          <div className="tablebox">
            <table>
              <thead>
                <tr>
                  <th>NO.</th>
                  <th>NAMA PEMENANG</th>
                  <th>TANGGAL & WAKTU</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {records.map((item, index) => (
                  <tr key={item.id}>
                    <td>{String(index + 1).padStart(2, "0")}</td>

                    <td className="gold">♛ {item.name}</td>

                    <td>{item.date}</td>

                    <td>
                      <span className="status">WINNER</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer>
        SPPG Wibawa Pasirkaliki Karawang © {new Date().getFullYear()}
        <span>Powered DYS917</span>
      </footer>
    </main>
  );
}