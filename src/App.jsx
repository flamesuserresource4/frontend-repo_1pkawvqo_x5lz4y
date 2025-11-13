import { useEffect, useMemo, useState } from 'react'

function Flashcard({ card, onDelete, onEdit }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className={`relative w-full h-48 sm:h-56 md:h-64 [perspective:1000px] cursor-pointer select-none`}
      onClick={() => setFlipped((f) => !f)}
    >
      <div
        className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${
          flipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        <div className="absolute inset-0 bg-white rounded-xl shadow-lg p-6 flex items-center justify-center text-center [backface-visibility:hidden] border border-gray-100">
          <p className="text-lg md:text-xl font-medium text-gray-800">{card.question}</p>
        </div>
        <div className="absolute inset-0 bg-blue-600 text-white rounded-xl shadow-lg p-6 flex items-center justify-center text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <p className="text-lg md:text-xl font-semibold">{card.answer}</p>
        </div>
      </div>
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 hover:opacity-100 transition-opacity" onClick={(e)=>e.stopPropagation()}>
        <button onClick={onEdit} className="text-xs bg-white/90 border border-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-white">Edit</button>
        <button onClick={onDelete} className="text-xs bg-white/90 border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-white">Delete</button>
      </div>
    </div>
  )
}

function CardForm({ initial, onSave, onCancel }) {
  const [question, setQuestion] = useState(initial?.question || '')
  const [answer, setAnswer] = useState(initial?.answer || '')
  const [deck, setDeck] = useState(initial?.deck || '')

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Question"
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Answer"
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="text"
        value={deck}
        onChange={(e) => setDeck(e.target.value)}
        placeholder="Deck (optional)"
        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-2 rounded border">Cancel</button>
        <button
          onClick={() => onSave({ question, answer, deck: deck || undefined })}
          className="px-3 py-2 rounded bg-blue-600 text-white"
        >
          Save
        </button>
      </div>
    </div>
  )
}

function App() {
  const baseUrl = useMemo(() => import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', [])
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [view, setView] = useState('list') // list | study
  const [index, setIndex] = useState(0)

  const fetchCards = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${baseUrl}/api/flashcards`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setCards(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCards()
  }, [])

  const createCard = async (payload) => {
    const res = await fetch(`${baseUrl}/api/flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Create failed')
    const saved = await res.json()
    setCards((c) => [saved, ...c])
  }

  const updateCard = async (id, payload) => {
    const res = await fetch(`${baseUrl}/api/flashcards/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Update failed')
    const saved = await res.json()
    setCards((c) => c.map((x) => (x.id === id ? saved : x)))
  }

  const deleteCard = async (id) => {
    const res = await fetch(`${baseUrl}/api/flashcards/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Delete failed')
    setCards((c) => c.filter((x) => x.id !== id))
  }

  const startStudy = () => {
    setView('study')
    setIndex(0)
  }

  const nextCard = () => setIndex((i) => (i + 1) % cards.length)
  const prevCard = () => setIndex((i) => (i - 1 + cards.length) % cards.length)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Flashcards</h1>
          <nav className="flex gap-2">
            <button onClick={() => setView('list')} className={`px-3 py-2 rounded ${view==='list'?'bg-blue-600 text-white':'bg-white border'}`}>Manage</button>
            <button onClick={() => setView('study')} className={`px-3 py-2 rounded ${view==='study'?'bg-blue-600 text-white':'bg-white border'}`}>Study</button>
            <a href="/test" className="px-3 py-2 rounded bg-white border">Backend Test</a>
          </nav>
        </header>

        {view === 'list' && (
          <div className="bg-white rounded-xl shadow p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Cards</h2>
              <button onClick={() => { setEditing(null); setShowForm(true) }} className="px-3 py-2 rounded bg-blue-600 text-white">Add Card</button>
            </div>

            {showForm && (
              <CardForm
                initial={editing}
                onSave={async (payload) => {
                  try {
                    if (editing) await updateCard(editing.id, payload)
                    else await createCard(payload)
                    setShowForm(false); setEditing(null)
                  } catch (e) { alert(e.message) }
                }}
                onCancel={() => { setShowForm(false); setEditing(null) }}
              />
            )}

            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : cards.length === 0 ? (
              <div className="text-center text-gray-600">
                <p>No cards yet. Create your first one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cards.map((card) => (
                  <Flashcard
                    key={card.id}
                    card={card}
                    onDelete={() => deleteCard(card.id).catch((e)=>alert(e.message))}
                    onEdit={() => { setEditing(card); setShowForm(true) }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'study' && (
          <div className="bg-white rounded-xl shadow p-5">
            {cards.length === 0 ? (
              <p className="text-gray-600">Add some cards first in Manage tab.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button onClick={prevCard} className="px-3 py-2 rounded bg-gray-100 border">Prev</button>
                  <span className="text-sm text-gray-500">{index + 1} / {cards.length}</span>
                  <button onClick={nextCard} className="px-3 py-2 rounded bg-gray-100 border">Next</button>
                </div>
                <Flashcard card={cards[index]} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
