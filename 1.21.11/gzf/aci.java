import io.netty.buffer.ByteBuf;

public record aci(String b) implements aay<ach> {
   public static final aao<ByteBuf, aci> a;

   public aci(String param1) {
      this.b = $$0;
   }

   public aba<aci> a() {
      return aco.a;
   }

   public void a(ach $$0) {
      $$0.a(this);
   }

   public String b() {
      return this.b;
   }

   static {
      a = aao.a(aam.p, aci::b, aci::new);
   }
}
