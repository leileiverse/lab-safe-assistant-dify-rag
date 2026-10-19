from web_demo.services.answer_service import build_conversational_answer
import os


def test_greeting_and_identity_are_answered_locally():
    ans = build_conversational_answer("\u4f60\u597d")
    assert ans is not None, "nihao should return an answer"
    assert "\u5b9e\u9a8c\u5ba4\u5b89\u5168\u5c0f\u52a9\u624b" in ans

    ans2 = build_conversational_answer("\u4f60\u662f\u4ec0\u4e48")
    assert ans2 is not None, "ni shi shenme should return an answer"
    assert "\u5b9e\u9a8c\u5ba4\u5b89\u5168" in ans2


def test_capability_and_thanks_are_answered():
    ans = build_conversational_answer("\u4f60\u80fd\u505a\u4ec0\u4e48")
    assert ans is not None
    assert "\u5316\u5b66\u54c1" in ans

    ans2 = build_conversational_answer("\u8c22\u8c22")
    assert ans2 is not None
    assert "\u5b89\u5168" in ans2


def test_mixed_safety_question_keeps_normal_pipeline():
    assert build_conversational_answer("\u4f60\u597d\uff0c\u4e59\u919a\u6cc4\u6f0f\u600e\u4e48\u529e") is None
    assert build_conversational_answer("\u6d53\u786b\u9178\u600e\u4e48\u5904\u7406") is None


def test_shortcuts_can_be_disabled(monkeypatch):
    monkeypatch.setenv("LABSAFE_CONVERSATIONAL_SHORTCUTS", "0")
    from web_demo.services.answer_service import _conversation_shortcuts_enabled
    assert _conversation_shortcuts_enabled() is False
    assert build_conversational_answer("\u4f60\u597d") is None


def test_more_greeting_variants():
    variants = [
        "\u4f60\u597d", "\u60a8\u597d", "\u55e8", "\u54c8\u55bd",
        "hello", "hi", "hey", "\u65e9\u4e0a\u597d", "\u665a\u4e0a\u597d",
    ]
    for q in variants:
        ans = build_conversational_answer(q)
        assert ans is not None, f"{q!r} should return greeting answer"


def test_more_identity_variants():
    variants = [
        "\u4f60\u662f\u8c01", "\u4f60\u662f\u4ec0\u4e48",
        "\u4f60\u662f\u505a\u4ec0\u4e48\u7684", "\u4ecb\u7ecd\u4e00\u4e0b\u4f60\u81ea\u5df1",
    ]
    for q in variants:
        ans = build_conversational_answer(q)
        assert ans is not None, f"{q!r} should return identity answer"


def test_with_punctuation():
    ans = build_conversational_answer("\u4f60\u597d\uff01")
    assert ans is not None, "nihao! should match after stripping punctuation"
    ans2 = build_conversational_answer("\u4f60\u597d\uff0c")
    assert ans2 is not None, "nihao, should match after stripping punctuation"
