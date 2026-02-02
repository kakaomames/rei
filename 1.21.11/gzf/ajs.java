import java.util.Optional;

public record ajs(Optional<jd<cfk>> b, Optional<jd<cfk>> c) implements aay<aib> {
   public static final aao<xq, ajs> a;

   public ajs(Optional<jd<cfk>> param1, Optional<jd<cfk>> param2) {
      this.b = $$0;
      this.c = $$1;
   }

   public aba<ajs> a() {
      return ahz.ci;
   }

   public void a(aib $$0) {
      $$0.a(this);
   }

   public Optional<jd<cfk>> b() {
      return this.b;
   }

   public Optional<jd<cfk>> e() {
      return this.c;
   }

   static {
      a = aao.a(cfk.b.a(aam::a), ajs::b, cfk.b.a(aam::a), ajs::e, ajs::new);
   }
}
