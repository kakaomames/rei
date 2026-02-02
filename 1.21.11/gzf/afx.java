import org.jspecify.annotations.Nullable;

public record afx(String b, @Nullable String c) implements aay<adb> {
   public static final aao<wx, afx> a = aay.a(afx::a, afx::new);

   private afx(wx $$0) {
      this($$0.p(), (String)$$0.c(wx::p));
   }

   public afx(String param1, @Nullable String param2) {
      this.b = $$0;
      this.c = $$1;
   }

   private void a(wx $$0) {
      $$0.a(this.b);
      $$0.a((Object)this.c, (aaq)(wx::a));
   }

   public aba<afx> a() {
      return ahz.cw;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public String b() {
      return this.b;
   }

   @Nullable
   public String e() {
      return this.c;
   }
}
