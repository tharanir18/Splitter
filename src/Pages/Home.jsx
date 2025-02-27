import React, { useState } from 'react';
import './Home.css';

const Home = () => {
  const [people, setPeople] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    paidBy: '',
    splitWith: []
  });
  const [showResults, setShowResults] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');

  const addPerson = () => {
    if (newPersonName.trim() !== '') {
      const updatedPeople = [...people, newPersonName];
      setPeople(updatedPeople);
      
      // Update newExpense paidBy if it's the first person
      if (people.length === 0) {
        setNewExpense({
          ...newExpense,
          paidBy: newPersonName,
          splitWith: [newPersonName]
        });
      }
      
      setNewPersonName('');
    }
  };

  const removePerson = (personIndex) => {
    const personToRemove = people[personIndex];
    const updatedPeople = people.filter((_, index) => index !== personIndex);
    
    // Update expenses to remove the person
    const updatedExpenses = expenses.map(expense => {
      const updatedSplitWith = expense.splitWith.filter(person => person !== personToRemove);
      let updatedPaidBy = expense.paidBy;
      
      if (expense.paidBy === personToRemove) {
        updatedPaidBy = updatedPeople.length > 0 ? updatedPeople[0] : '';
      }
      
      return {
        ...expense,
        splitWith: updatedSplitWith,
        paidBy: updatedPaidBy
      };
    }).filter(expense => expense.splitWith.length > 0); // Remove expenses with no one to split with
    
    // Update new expense form
    let updatedNewExpense = { ...newExpense };
    if (newExpense.paidBy === personToRemove) {
      updatedNewExpense.paidBy = updatedPeople.length > 0 ? updatedPeople[0] : '';
    }
    updatedNewExpense.splitWith = updatedNewExpense.splitWith.filter(person => person !== personToRemove);
    
    setPeople(updatedPeople);
    setExpenses(updatedExpenses);
    setNewExpense(updatedNewExpense);
  };

  const handleNewExpenseChange = (e) => {
    const { name, value } = e.target;
    setNewExpense({
      ...newExpense,
      [name]: value
    });
  };

  const handleSplitWithChange = (person) => {
    const isPersonIncluded = newExpense.splitWith.includes(person);
    let updatedSplitWith;
    
    if (isPersonIncluded) {
      updatedSplitWith = newExpense.splitWith.filter(p => p !== person);
    } else {
      updatedSplitWith = [...newExpense.splitWith, person];
    }
    
    setNewExpense({
      ...newExpense,
      splitWith: updatedSplitWith
    });
  };

  const addExpense = () => {
    if (newExpense.description && newExpense.amount && newExpense.paidBy && newExpense.splitWith.length > 0) {
      const id = expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) + 1 : 1;
      setExpenses([
        ...expenses,
        {
          id,
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          paidBy: newExpense.paidBy,
          splitWith: [...newExpense.splitWith]
        }
      ]);
      
      // Reset form but keep the same paidBy and splitWith
      setNewExpense({
        description: '',
        amount: '',
        paidBy: newExpense.paidBy,
        splitWith: [...newExpense.splitWith]
      });
    }
  };

  const removeExpense = (id) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  const calculateBalances = () => {
    // Initialize balances for each person
    const balances = {};
    people.forEach(person => {
      balances[person] = 0;
    });

    // Calculate what each person paid and owes
    expenses.forEach(expense => {
      const paidBy = expense.paidBy;
      const splitAmount = expense.amount / expense.splitWith.length;
      
      // Add the full amount to the person who paid
      balances[paidBy] += expense.amount;
      
      // Subtract each person's share
      expense.splitWith.forEach(person => {
        balances[person] -= splitAmount;
      });
    });

    return balances;
  };

  const calculateSettlements = (balances) => {
    const settlements = [];
    const people = Object.keys(balances);
    
    // Create a copy of balances that we can modify
    const remainingBalances = { ...balances };
    
    // Keep settling until all balances are close to zero
    while (people.some(person => Math.abs(remainingBalances[person]) > 0.01)) {
      // Find the person who owes the most (most negative balance)
      const debtor = people.reduce((a, b) => 
        remainingBalances[a] < remainingBalances[b] ? a : b
      );
      
      // Find the person who is owed the most (most positive balance)
      const creditor = people.reduce((a, b) => 
        remainingBalances[a] > remainingBalances[b] ? a : b
      );
      
      // If the balances are very close to zero, break to avoid infinite loops
      if (Math.abs(remainingBalances[debtor]) < 0.01 || Math.abs(remainingBalances[creditor]) < 0.01) {
        break;
      }
      
      // Calculate the amount to transfer
      const amount = Math.min(Math.abs(remainingBalances[debtor]), remainingBalances[creditor]);
      
      // Update the balances
      remainingBalances[debtor] += amount;
      remainingBalances[creditor] -= amount;
      
      // Add the settlement
      settlements.push({
        from: debtor,
        to: creditor,
        amount: Math.round(amount * 100) / 100
      });
    }
    
    return settlements;
  };

  const toggleResults = () => {
    setShowResults(!showResults);
  };

  const balances = calculateBalances();
  const settlements = calculateSettlements(balances);

  return (
    <div className="expense-splitter">
      <h1 className="app-title">Expense Splitter</h1>
      
      {/* People Management */}
      <div className="section people-section">
        <h2 className="section-title">People</h2>
        
        {people.length > 0 ? (
          <div className="people-list">
            {people.map((person, index) => (
              <div key={index} className="person-tag">
                <span>{person}</span>
                <button 
                  onClick={() => removePerson(index)}
                  className="remove-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-people-message">Add people to start splitting expenses</div>
        )}
        
        <div className="add-person-form">
          <input
            type="text"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            placeholder="Add new person"
            className="text-input"
          />
          <button 
            onClick={addPerson}
            className="add-btn"
            disabled={!newPersonName.trim()}
          >
            Add
          </button>
        </div>
      </div>
      
      {/* Expenses List */}
      <div className="section expenses-section">
        <h2 className="section-title">Expenses</h2>
        
        {expenses.length > 0 ? (
          <div className="expenses-table-container">
            <table className="expenses-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Paid By</th>
                  <th>Split With</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.description}</td>
                    <td>${expense.amount.toFixed(2)}</td>
                    <td>{expense.paidBy}</td>
                    <td>{expense.splitWith.join(', ')}</td>
                    <td>
                      <button 
                        onClick={() => removeExpense(expense.id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-expenses-message">No expenses yet. Add people first, then add expenses.</div>
        )}
        
        {/* Add Expense Form */}
        {people.length > 0 ? (
          <div className="add-expense-form">
            <h3 className="form-title">Add New Expense</h3>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  value={newExpense.description}
                  onChange={handleNewExpenseChange}
                  placeholder="e.g., Dinner, Taxi, etc."
                  className="text-input"
                />
              </div>
              
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  name="amount"
                  value={newExpense.amount}
                  onChange={handleNewExpenseChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="text-input"
                />
              </div>
            </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Paid By</label>
                <select
                  name="paidBy"
                  value={newExpense.paidBy}
                  onChange={handleNewExpenseChange}
                  className="select-input"
                >
                  <option value="">Select a person</option>
                  {people.map((person, index) => (
                    <option key={index} value={person}>{person}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Split With</label>
                <div className="split-with-tags">
                  {people.map((person, index) => (
                    <div 
                      key={index}
                      onClick={() => handleSplitWithChange(person)}
                      className={`split-tag ${newExpense.splitWith.includes(person) ? 'selected' : ''}`}
                    >
                      {person}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <button 
              onClick={addExpense}
              className="submit-btn"
              disabled={!newExpense.description || !newExpense.amount || !newExpense.paidBy || newExpense.splitWith.length === 0}
            >
              Add Expense
            </button>
          </div>
        ) : (
          <div className="form-instruction">Add people to enable expense entry</div>
        )}
      </div>
      
      {/* Results Section */}
      {expenses.length > 0 && (
        <div className="calculate-section">
          <button 
            onClick={toggleResults}
            className="calculate-btn"
          >
            {showResults ? 'Hide' : 'Calculate'} Results
          </button>
        </div>
      )}
      
      {showResults && expenses.length > 0 && (
        <div className="section results-section">
          <h2 className="section-title">Results</h2>
          
          {/* Individual Balances */}
          <div className="balances-container">
            <h3 className="subsection-title">Individual Balances</h3>
            <div className="balances-grid">
              {Object.entries(balances).map(([person, balance]) => (
                <div 
                  key={person}
                  className={`balance-card ${
                    balance > 0 
                      ? 'positive' 
                      : balance < 0 
                        ? 'negative' 
                        : 'neutral'
                  }`}
                >
                  <div className="person-name">{person}</div>
                  <div className="balance-amount">
                  {balance > 0 
  ? `Gets back $${balance.toFixed(2)}` 
  : balance < 0 
    ? `Owes $${Math.abs(balance).toFixed(2)}` 
    : `All settled up`}

                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Settlement Plan */}
          <div className="settlement-container">
            <h3 className="subsection-title">Settlement Plan</h3>
            {settlements.length > 0 ? (
              <ul className="settlement-list">
                {settlements.map((settlement, index) => (
                  <li key={index} className="settlement-item">
                    <span className="debtor">{settlement.from}</span> pays <span className="creditor">{settlement.to}</span> <span className="amount">${settlement.amount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="no-settlements-message">Everyone is settled up!</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;