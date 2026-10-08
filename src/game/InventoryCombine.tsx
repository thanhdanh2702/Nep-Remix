import { useState } from 'react';
import type { Command, GameState } from '../core';
import { content } from './store';
import { asset, itemAsset } from './assets';
import { Modal } from './Modal';
import {
  DocumentViewer,
  c3DocumentForItem,
  c3DocumentForClue,
  C3_DOCUMENTS,
  type DocumentContent,
} from './DocumentViewer';
import './puzzle.css';

// Bag + clue notebook. Picking two items and pressing "Ghép" sends item/combine.
export function InventoryCombine({
  state,
  initialItem,
  send,
  notify,
  onClose,
}: {
  state: GameState;
  initialItem: string;
  send: (command: Command) => GameState | null;
  notify: (message: string) => void;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState<string[]>(initialItem ? [initialItem] : []);
  const [viewingDoc, setViewingDoc] = useState<DocumentContent | null>(null);

  const toggle = (id: string) =>
    setPicked(list => (list.includes(id) ? list.filter(x => x !== id) : [...list, id].slice(-2)));

  const combine = () => {
    if (send({ type: 'item/combine', payload: { itemIds: [picked[0], picked[1]] } })) setPicked([]);
    else notify('Hai món này chưa ghép được với nhau.'); // replaces the engine's English reason
  };

  const c3CompletedDialogues = state.journey.c3?.completedDialogueIds ?? [];
  const hasReadBanSua = c3CompletedDialogues.includes('d-c3-ban-sua');

  return (
    <>
      <Modal title="Túi đồ & Sổ manh mối" wide className="journal-modal" onClose={onClose}>
        <div className="journal-columns">
          <section>
            <h3>Vật phẩm của An</h3>
            {!state.inventory.itemIds.length && <p>Túi đồ còn trống.</p>}
            {state.inventory.itemIds.map(id => {
              const doc = c3DocumentForItem(id);
              return (
                <div key={id} className="journal-item-entry">
                  <button
                    className={`journal-item${picked.includes(id) ? ' selected' : ''}`}
                    aria-pressed={picked.includes(id)}
                    onClick={() => toggle(id)}
                  >
                    {itemAsset(id) && <img src={asset(itemAsset(id)!)} alt="" />}
                    <span>
                      <strong>{content.itemsById.get(id)?.name}</strong>
                      <span className="journal-item-text">{content.itemsById.get(id)?.description}</span>
                    </span>
                  </button>
                  {doc && (
                    <div className="journal-item-actions">
                      <button
                        type="button"
                        className="journal-read-button"
                        onClick={e => {
                          e.stopPropagation();
                          setViewingDoc(doc);
                        }}
                        aria-label={`Đọc văn bản ${doc.title}`}
                      >
                        Đọc văn bản
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <p className="fine-print">Chọn 2 vật phẩm rồi bấm Ghép để chế tạo dụng cụ mới.</p>
            <button className="primary" disabled={picked.length !== 2} onClick={combine}>
              Ghép
            </button>
          </section>
          <section>
            <h3>Những lời đã ghi nhớ</h3>
            {!state.notebook.unlockedClueIds.length && !hasReadBanSua && (
              <p>Trò chuyện và khám phá để ghi lại manh mối.</p>
            )}
            {state.notebook.unlockedClueIds.map(id => {
              const doc = c3DocumentForClue(id);
              return (
                <article key={id}>
                  <h4>{content.cluesById.get(id)?.title}</h4>
                  <p>{content.cluesById.get(id)?.description}</p>
                  {doc && (
                    <button
                      type="button"
                      className="journal-read-button"
                      onClick={() => setViewingDoc(doc)}
                      aria-label={`Xem lại tài liệu ${doc.title}`}
                    >
                      Xem lại tài liệu
                    </button>
                  )}
                </article>
              );
            })}
            {hasReadBanSua && (
              <article key="doc-c3-ban-sua-entry">
                <h4>{C3_DOCUMENTS['doc-c3-ban-sua'].title}</h4>
                <p>
                  Văn bản đối chiếu đặt trên bàn đàm phán Dinh thự (S3). Đã đánh dấu dòng chèn thêm điều kiện áp đặt.
                </p>
                <button
                  type="button"
                  className="journal-read-button"
                  onClick={() => setViewingDoc(C3_DOCUMENTS['doc-c3-ban-sua'])}
                  aria-label="Xem lại Bản sửa hồ sơ Mai–Vinh"
                >
                  Xem lại bản sửa
                </button>
              </article>
            )}
          </section>
        </div>
      </Modal>

      {/* Read-only Document Viewer for Journal Reread */}
      {viewingDoc && (
        <DocumentViewer
          document={viewingDoc}
          readOnly={true}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </>
  );
}
