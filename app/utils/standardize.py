"""
Text standardization utility.
Ensures consistent formatting across the application.
"""

import re

def standardize_text(value):
    """
    Standardize text: capitalize first letter of each word, trim whitespace.
    Handles accented characters properly.
    """
    if not value or not isinstance(value, str):
        return value
    
    value = value.strip()
    if not value:
        return value
    
    # Split by spaces and capitalize each word
    words = value.split()
    standardized = ' '.join(word.capitalize() for word in words)
    return standardized


def standardize_name(value):
    """
    Standardize a person's name: capitalize each part.
    Handles compound names like "María Del Pilar"
    """
    if not value or not isinstance(value, str):
        return value
    
    value = value.strip()
    if not value:
        return value
    
    words = value.split()
    result = []
    for word in words:
        # Keep certain prepositions lowercase when in middle of name
        lower_word = word.lower()
        if lower_word in ('de', 'del', 'la', 'los', 'las', 'y', 'e', 'el'):
            result.append(lower_word)
        else:
            result.append(word.capitalize())
    
    # Always capitalize first word
    if result:
        result[0] = result[0].capitalize()
    
    return ' '.join(result)


def standardize_upper(value):
    """Convert to UPPERCASE (for identification numbers, codes, etc.)"""
    if not value or not isinstance(value, str):
        return value
    return value.strip().upper()


def standardize_lower(value):
    """Convert to lowercase (for emails, etc.)"""
    if not value or not isinstance(value, str):
        return value
    return value.strip().lower()


def standardize_phone(value):
    """Clean phone number: remove spaces, dashes, ensure consistent format"""
    if not value or not isinstance(value, str):
        return value
    
    # Remove non-numeric characters except +
    cleaned = re.sub(r'[^\d+]', '', value.strip())
    return cleaned


def standardize_data(data, fields_map):
    """
    Apply standardization to multiple fields at once.
    
    fields_map: dict of {field_name: 'standardize_text'|'standardize_name'|'upper'|'lower'|'phone'}
    
    Example:
        standardize_data(request_data, {
            'first_name': 'standardize_text',
            'last_name': 'standardize_text',
            'email': 'lower',
            'phone': 'phone',
            'identification_number': 'upper'
        })
    """
    if not data:
        return data
    
    standardized = data.copy() if isinstance(data, dict) else data
    
    for field, method in fields_map.items():
        if field in standardized and standardized[field] is not None:
            value = standardized[field]
            if method == 'standardize_text':
                standardized[field] = standardize_text(value)
            elif method == 'standardize_name':
                standardized[field] = standardize_name(value)
            elif method == 'upper':
                standardized[field] = standardize_upper(value)
            elif method == 'lower':
                standardized[field] = standardize_lower(value)
            elif method == 'phone':
                standardized[field] = standardize_phone(value)
    
    return standardized